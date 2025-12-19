import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppraisalRecord } from '../models/appraisal-record.schema';
import { AppraisalCycle } from '../models/appraisal-cycle.schema';
import { AppraisalRecordStatus, AppraisalCycleStatus } from '../enums/performance.enums';

@Injectable()
export class ReportingService {
  constructor(
    @InjectModel(AppraisalRecord.name) private recordModel: Model<any>,
    @InjectModel(AppraisalCycle.name) private cycleModel: Model<any>,
    @InjectModel('EmployeeProfile') private employeeModel: Model<any>,
    @InjectModel('Department') private departmentModel: Model<any>,
  ) {}

  async archive(recordId: string) {
    const record = await this.recordModel.findById(recordId).exec();
    if (!record) throw new NotFoundException('Appraisal record not found');
    if (record.status !== AppraisalRecordStatus.HR_PUBLISHED) throw new BadRequestException('Only published appraisals can be archived');

    record.status = AppraisalRecordStatus.ARCHIVED;
    record.archivedAt = new Date();
    await record.save();

    return { success: true, recordId, status: AppraisalRecordStatus.ARCHIVED, archivedAt: record.archivedAt };
  }

  async bulkArchive(cycleId: string) {
    const cycle = await this.cycleModel.findById(cycleId).lean().exec() as any;
    if (!cycle) throw new NotFoundException('Cycle not found');
    if (cycle.status !== AppraisalCycleStatus.CLOSED) throw new BadRequestException('Only closed cycles can have appraisals archived');

    const now = new Date();
    const result = await this.recordModel.updateMany(
      { cycleId: new Types.ObjectId(cycleId), status: AppraisalRecordStatus.HR_PUBLISHED },
      { $set: { status: AppraisalRecordStatus.ARCHIVED, archivedAt: now } },
    );

    await this.cycleModel.findByIdAndUpdate(cycleId, { status: AppraisalCycleStatus.ARCHIVED, archivedAt: now });

    return { success: true, cycleId, archivedCount: result.modifiedCount, cycleArchived: true, archivedAt: now };
  }

  async getHistory(employeeId: string) {
    const records = await this.recordModel
      .find({ employeeProfileId: new Types.ObjectId(employeeId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec() as any[];

    const cycleIds = [...new Set(records.map(r => r.cycleId?.toString()))].filter(Boolean);
    const cycles = await this.cycleModel.find({ _id: { $in: cycleIds.map(id => new Types.ObjectId(id)) } }).lean().exec() as any[];
    const cycleMap = new Map(cycles.map(c => [c._id.toString(), c]));

    const trendData = records
      .filter(r => r.totalScore !== undefined && r.totalScore !== null)
      .map(r => {
        const cycle = cycleMap.get(r.cycleId?.toString());
        return {
          cycleId: r.cycleId?.toString(),
          cycleName: cycle?.name || 'Unknown',
          cycleType: cycle?.cycleType,
          date: r.hrPublishedAt || r.managerSubmittedAt || r.createdAt,
          score: r.totalScore,
          ratingLabel: r.overallRatingLabel,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const scores = trendData.map(t => t.score);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const trend = scores.length >= 2 ? (scores[scores.length - 1] - scores[0]) : 0;
    const trendDirection = trend > 0 ? 'IMPROVING' : trend < 0 ? 'DECLINING' : 'STABLE';

    return {
      employeeId,
      totalAppraisals: records.length,
      history: records.map(r => ({
        ...r,
        cycleName: cycleMap.get(r.cycleId?.toString())?.name || 'Unknown',
      })),
      trendAnalysis: {
        dataPoints: trendData,
        averageScore: Math.round(avgScore * 100) / 100,
        highestScore: scores.length > 0 ? Math.max(...scores) : null,
        lowestScore: scores.length > 0 ? Math.min(...scores) : null,
        scoreDelta: Math.round(trend * 100) / 100,
        trendDirection,
        cyclesAnalyzed: trendData.length,
      },
    };
  }

  async generateOutcomeReport(cycleId: string) {
    const cycle = await this.cycleModel.findById(cycleId).lean().exec() as any;
    if (!cycle) throw new NotFoundException('Cycle not found');

    const records = await this.recordModel.find({ cycleId: new Types.ObjectId(cycleId) }).lean().exec() as any[];

    const deptIds = [...new Set(records.map(r => r.departmentId?.toString()))].filter(Boolean);
    const departments = await this.departmentModel.find({ _id: { $in: deptIds.map(id => new Types.ObjectId(id)) } }).lean().exec() as any[];
    const deptMap = new Map(departments.map(d => [d._id.toString(), d.name]));

    const empIds = [...new Set(records.map(r => r.employeeProfileId?.toString()))].filter(Boolean);
    const employees = await this.employeeModel.find({ _id: { $in: empIds.map(id => new Types.ObjectId(id)) } }).lean().exec() as any[];
    const empMap = new Map(employees.map(e => [e._id.toString(), { name: `${e.firstName} ${e.lastName}`, department: e.departmentId?.toString() }]));

    let totalCompleted = 0;
    let totalScore = 0;
    const ratingDistribution: Record<string, number> = {};
    const byDepartment: Record<string, { name: string; count: number; totalScore: number; employees: any[] }> = {};

    for (const rec of records) {
      const empInfo = empMap.get(rec.employeeProfileId?.toString());
      const deptId = empInfo?.department || rec.departmentId?.toString() || 'Unknown';
      const deptName = deptMap.get(deptId) || 'Unknown Department';

      if (!byDepartment[deptId]) {
        byDepartment[deptId] = { name: deptName, count: 0, totalScore: 0, employees: [] };
      }

      if ([AppraisalRecordStatus.HR_PUBLISHED, AppraisalRecordStatus.ARCHIVED].includes(rec.status)) {
        totalCompleted++;
        totalScore += rec.totalScore ?? 0;
        const label = rec.overallRatingLabel || 'Unrated';
        ratingDistribution[label] = (ratingDistribution[label] || 0) + 1;

        byDepartment[deptId].count++;
        byDepartment[deptId].totalScore += rec.totalScore ?? 0;
        byDepartment[deptId].employees.push({
          employeeId: rec.employeeProfileId?.toString(),
          employeeName: empInfo?.name || 'Unknown',
          score: rec.totalScore,
          ratingLabel: rec.overallRatingLabel,
          status: rec.status,
        });
      }
    }

    const departmentBreakdown = Object.entries(byDepartment).map(([deptId, data]) => ({
      departmentId: deptId,
      departmentName: data.name,
      completedCount: data.count,
      averageScore: data.count > 0 ? Math.round((data.totalScore / data.count) * 100) / 100 : 0,
      employees: data.employees,
    }));

    const report = {
      cycleId,
      cycleName: cycle.name,
      cycleType: cycle.cycleType,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      status: cycle.status,
      summary: {
        totalRecords: records.length,
        completedRecords: totalCompleted,
        pendingRecords: records.length - totalCompleted,
        completionRate: records.length > 0 ? Math.round((totalCompleted / records.length) * 100) : 0,
        averageScore: totalCompleted > 0 ? Math.round((totalScore / totalCompleted) * 100) / 100 : 0,
      },
      ratingDistribution,
      departmentBreakdown,
      generatedAt: new Date(),
    };

    return report;
  }
}
