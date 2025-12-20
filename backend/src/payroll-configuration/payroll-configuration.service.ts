
import { Injectable, BadRequestException, NotFoundException, ForbiddenException ,Logger} from '@nestjs/common';
import { InjectModel,InjectConnection } from '@nestjs/mongoose';
import mongoose, { Model, isValidObjectId, Connection} from 'mongoose';
import { allowance, allowanceDocument } from './models/allowance.schema';
import { CreateAllowanceDto } from './dtos/create-allowance.dto';
import { UpdateAllowanceDto } from './dtos/update-allowance.dto';
import {payrollPolicies,payrollPoliciesDocument,} from './models/payrollPolicies.schema';
import { CreatePayrollPolicyDto } from './dtos/create-payroll-policy.dto';
import { UpdatePayrollPolicyDto } from './dtos/update-payroll-policy.dto';
import { payGrade, payGradeDocument } from './models/payGrades.schema';
import { CreatePayGradeDto } from './dtos/create-pay-grade.dto';
import { UpdatePayGradeDto } from './dtos/update-pay-grade.dto';
import { payType, payTypeDocument } from './models/payType.schema';
import { CreatePayTypeDto } from './dtos/create-pay-type.dto';
import { UpdatePayTypeDto } from './dtos/update-pay-type.dto';
import {signingBonus,signingBonusDocument,} from './models/signingBonus.schema';
import { CreateSigningBonusDto } from './dtos/create-signing-bonus.dto';
import { UpdateSigningBonusDto } from './dtos/update-signing-bonus.dto';
import {terminationAndResignationBenefits,terminationAndResignationBenefitsDocument,} from './models/terminationAndResignationBenefits';
import { CreateTerminationBenefitsDto } from './dtos/create-termination-benefits.dto';
import { UpdateTerminationBenefitsDto } from './dtos/update-termination-benefits.dto';
import { taxRules, taxRulesDocument } from './models/taxRules.schema';
import { CreateTaxRuleDto } from './dtos/CreateTaxRuleDto';
import { UpdateTaxRuleDto } from './dtos/UpdateTaxRuleDto';
import { insuranceBrackets, insuranceBracketsDocument } from './models/insuranceBrackets.schema';
import { CreateInsuranceBracketDto } from './dtos/CreateInsuranceBracketDto';
import { UpdateInsuranceBracketDto } from './dtos/UpdateInsuranceBracketDto';
import { CompanyWideSettings, CompanyWideSettingsDocument } from './models/CompanyWideSettings.schema';
import { CreateCompanyWideSettingsDto } from './dtos/CreateCompanyWideSettingsDto';
import { UpdateCompanyWideSettingsDto } from './dtos/UpdateCompanyWideSettingsDto';
import { ConfigStatus } from './enums/payroll-configuration-enums';

import fs from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip } from 'zlib';
import path from 'path';


@Injectable()
export class ConfigurationService {
     private readonly logger = new Logger(ConfigurationService.name);
     constructor(
    @InjectModel(allowance.name)
    private readonly allowanceModel: Model<allowanceDocument>,

    @InjectModel(payrollPolicies.name)
        private readonly payrollPoliciesModel: Model<payrollPoliciesDocument>,
    @InjectModel(payGrade.name)
        private readonly payGradeModel: Model<payGradeDocument>,
        //private readonly allowancesService: AllowancesService,
    @InjectModel(payType.name)
        private readonly payTypeModel: Model<payTypeDocument>,
    @InjectModel(signingBonus.name)
        private readonly signingBonusModel: Model<signingBonusDocument>,
        
    @InjectModel(terminationAndResignationBenefits.name)
        private readonly terminationBenefitsModel: Model<terminationAndResignationBenefitsDocument>,
    @InjectModel(taxRules.name)
        private taxRulesModel: Model<taxRulesDocument>,
    @InjectModel(insuranceBrackets.name)
        private insuranceBracketsModel: Model<insuranceBracketsDocument>,
     @InjectModel(CompanyWideSettings.name)
        private companyWideSettingsModel: Model<CompanyWideSettingsDocument>,

    @InjectConnection() private readonly connection: Connection

  ) {}
  //----------------------------------------------------------Payroll Policy Services-------------------------------------------------------------
  async createPayrollPolicy(
      createPayrollPolicyDto: CreatePayrollPolicyDto,
      createdById: string,
    ){
      const {
        policyName,
        policyType,
        description,
        effectiveDate,
        ruleDefinition,
        applicability,
      } = createPayrollPolicyDto;
  
      // Enforce unique policy name (you can later refine uniqueness rules if needed)
      const existing = await this.payrollPoliciesModel
        .findOne({ policyName })
        .exec();
      if (existing) {
        throw new BadRequestException(
          'A payroll policy with this name already exists',
        );
      }
  
      const effectiveDateObj = new Date(effectiveDate);
      if (isNaN(effectiveDateObj.getTime())) {
        throw new BadRequestException('Invalid effectiveDate format');
      }
  
      const doc = new this.payrollPoliciesModel({
        policyName,
        policyType,
        description,
        effectiveDate: effectiveDateObj,
        ruleDefinition: {
          percentage: ruleDefinition.percentage,
          fixedAmount: ruleDefinition.fixedAmount,
          thresholdAmount: ruleDefinition.thresholdAmount,
        },
        applicability,
        status: ConfigStatus.DRAFT,
        createdBy: createdById,
      });
  
      return doc.save();
    }
  
    async findAllPayrollPolicies() {
      return this.payrollPoliciesModel.find().exec();
    }
  
    async findOnePayrollPolicy(id: string) {
      if (!isValidObjectId(id)) {
        throw new BadRequestException('Invalid payroll policy id');
      }
  
      const doc = await this.payrollPoliciesModel.findById(id).exec();
      if (!doc) {
        throw new NotFoundException('Payroll policy not found');
      }
  
      return doc;
    }
  
    async updatePayrollPolicy(
      id: string,
      updatePayrollPolicyDto: UpdatePayrollPolicyDto,
    ){
      if (!isValidObjectId(id)) {
        throw new BadRequestException('Invalid payroll policy id');
      }
  
      const doc = await this.payrollPoliciesModel.findById(id).exec();
      if (!doc) {
        throw new NotFoundException('Payroll policy not found');
      }
  
      // Phase 1 rule: only edit while status is DRAFT
      if (doc.status !== ConfigStatus.DRAFT) {
        throw new BadRequestException(
          'Only draft payroll policies can be edited',
        );
      }
  
      const {
        policyName,
        policyType,
        description,
        effectiveDate,
        ruleDefinition,
        applicability,
      } = updatePayrollPolicyDto;
  
      if (policyName !== undefined) {
        doc.policyName = policyName;
      }
  
      if (policyType !== undefined) {
        doc.policyType = policyType;
      }
  
      if (description !== undefined) {
        doc.description = description;
      }
  
      if (effectiveDate !== undefined) {
        const effectiveDateObj = new Date(effectiveDate);
        if (isNaN(effectiveDateObj.getTime())) {
          throw new BadRequestException('Invalid effectiveDate format');
        }
        doc.effectiveDate = effectiveDateObj;
      }
  
      if (ruleDefinition !== undefined) {
        if (!doc.ruleDefinition) {
          // safety: initialize if missing for some reason
          (doc as any).ruleDefinition = {};
        }
  
        if (ruleDefinition.percentage !== undefined) {
          doc.ruleDefinition.percentage = ruleDefinition.percentage;
        }
  
        if (ruleDefinition.fixedAmount !== undefined) {
          doc.ruleDefinition.fixedAmount = ruleDefinition.fixedAmount;
        }
  
        if (ruleDefinition.thresholdAmount !== undefined) {
          doc.ruleDefinition.thresholdAmount = ruleDefinition.thresholdAmount;
        }
      }
  
      if (applicability !== undefined) {
        doc.applicability = applicability;
      }
  
      return doc.save();
    }
  //---------------------------------------------------------Pay-Grade Services--------------------------------------------------------------
 private async calculateTotalApprovedAllowances() {
    const allAllowances = await this.findAllAllowances();
    const approvedAllowances = allAllowances.filter(allowance => allowance.status === ConfigStatus.APPROVED);
    return approvedAllowances.reduce((total, allowance) => total + (allowance.amount || 0), 0);
  }

  async createPayGrade(
    createPayGradeDto: CreatePayGradeDto,
    createdById: string,
  ) {
    const { grade, baseSalary } = createPayGradeDto;

    const existing = await this.payGradeModel.findOne({ grade }).exec();
    if (existing) {
      throw new BadRequestException('Pay grade with this name already exists');
    }

    // Calculate gross salary automatically
    const totalApprovedAllowances = await this.calculateTotalApprovedAllowances();
    const grossSalary = baseSalary + totalApprovedAllowances;

    const doc = new this.payGradeModel({
      grade,
      baseSalary,
      grossSalary,
      status: ConfigStatus.DRAFT,
      createdBy: createdById,
    });

    return doc.save();
  }

  async findAllPayGrades() {
    return this.payGradeModel.find().exec();
  }

  async findOnePayGrade(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid pay grade id');
    }

    const doc = await this.payGradeModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Pay grade not found');
    }

    return doc;
  }

  async updatePayGrade(
    id: string,
    updatePayGradeDto: UpdatePayGradeDto,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid pay grade id');
    }

    const doc = await this.payGradeModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Pay grade not found');
    }

    if (doc.status !== ConfigStatus.DRAFT) {
      throw new BadRequestException('Only draft pay grades can be edited');
    }

    // Apply updates if provided
    if (updatePayGradeDto.grade !== undefined) {
      doc.grade = updatePayGradeDto.grade;
    }
    if (updatePayGradeDto.baseSalary !== undefined) {
      doc.baseSalary = updatePayGradeDto.baseSalary;
    }

    // Recalculate gross salary automatically when base salary changes
    const totalApprovedAllowances = await this.calculateTotalApprovedAllowances();
    doc.grossSalary = doc.baseSalary + totalApprovedAllowances;

    return doc.save();
  }
  //---------------------------------------------------------Pay-Types Services--------------------------------------------------------------
 async createPayType(
      createPayTypeDto: CreatePayTypeDto,
      createdById: string,
    ) {
      const { type, amount } = createPayTypeDto;
  
      // Ensure unique type
      const existing = await this.payTypeModel.findOne({ type }).exec();
      if (existing) {
        throw new BadRequestException('Pay type with this name already exists');
      }
  
      const doc = new this.payTypeModel({
        type,
        amount,
        status: ConfigStatus.DRAFT,
        createdBy: createdById,
      });
  
      return doc.save();
    }
  
    async findAllPayTypes() {
      return this.payTypeModel.find().exec();
    }
  
    async findOnePayType(id: string){
      if (!isValidObjectId(id)) {
        throw new BadRequestException('Invalid pay type id');
      }
  
      const doc = await this.payTypeModel.findById(id).exec();
      if (!doc) {
        throw new NotFoundException('Pay type not found');
      }
  
      return doc;
    }
  
    async updatePayType(
      id: string,
      updatePayTypeDto: UpdatePayTypeDto,
    ) {
      if (!isValidObjectId(id)) {
        throw new BadRequestException('Invalid pay type id');
      }
  
      const doc = await this.payTypeModel.findById(id).exec();
      if (!doc) {
        throw new NotFoundException('Pay type not found');
      }
  
      // Phase 1 rule: only edit while status is DRAFT
      if (doc.status !== ConfigStatus.DRAFT) {
        throw new BadRequestException('Only draft pay types can be edited');
      }
  
      if (updatePayTypeDto.type !== undefined) {
        doc.type = updatePayTypeDto.type;
      }
  
      if (updatePayTypeDto.amount !== undefined) {
        doc.amount = updatePayTypeDto.amount;
      }
  
      return doc.save();
    }

  //------------------------------------------------Payroll Allowance Services-------------------------------------------------------------
    async createAllowance(
        createAllowanceDto: CreateAllowanceDto,
        createdById: string,
      ){
        const { name, amount } = createAllowanceDto;
    
        // Ensure unique name (optional but nice to enforce at service level too)
        const existing = await this.allowanceModel.findOne({ name }).exec();
        if (existing) {
          throw new BadRequestException('Allowance with this name already exists');
        }
    
        const doc = new this.allowanceModel({
          name,
          amount,
          status: ConfigStatus.DRAFT,
          createdBy: createdById,
        });
    
        return doc.save();
      }
    
      async findAllAllowances() {
        return this.allowanceModel.find().exec();
      }
    
      async findOneAllowance(id: string) {
        if (!isValidObjectId(id)) {
          throw new BadRequestException('Invalid allowance id');
        }
    
        const doc = await this.allowanceModel.findById(id).exec();
        if (!doc) {
          throw new NotFoundException('Allowance not found');
        }
    
        return doc;
      }
    
      async updateAllowance(
        id: string,
        updateAllowanceDto: UpdateAllowanceDto,
      ){
        if (!isValidObjectId(id)) {
          throw new BadRequestException('Invalid allowance id');
        }
    
        const doc = await this.allowanceModel.findById(id).exec();
        if (!doc) {
          throw new NotFoundException('Allowance not found');
        }
    
        // Phase 1 rule: only edit while status is DRAFT
        if (doc.status !== ConfigStatus.DRAFT) {
          throw new BadRequestException(
            'Only draft allowances can be edited',
          );
        }
    
        if (updateAllowanceDto.name !== undefined) {
          doc.name = updateAllowanceDto.name;
        }
    
        if (updateAllowanceDto.amount !== undefined) {
          doc.amount = updateAllowanceDto.amount;
        }
    
        return doc.save();
      }
      
      //---------------------------------------------------------Phase 4 Payroll manager approval---------------------------------------------------------------------------------
      async approve(id: string, approverId: string) {
        const rule = await this.allowanceModel.findById(id);
        if (!rule) throw new NotFoundException('Not found');
        
        if (rule.status === ConfigStatus.APPROVED || rule.status === ConfigStatus.REJECTED) {
          throw new ForbiddenException('Approved/rejected Conigurations cannot be approved');
        }
        rule.status = ConfigStatus.APPROVED;
        rule.approvedBy = new mongoose.Types.ObjectId(approverId);
        rule.approvedAt = new Date();
    
        return rule.save();
      }
    
      async reject(id: string, approverId: string) {
        const rule = await this.allowanceModel.findById(id);
        if (!rule) throw new NotFoundException('Allowance not found');
        if (rule.status === ConfigStatus.APPROVED || rule.status === ConfigStatus.REJECTED) {
          throw new ForbiddenException('Approved/Rejected allowances cannot be rejected');
        }
    
        rule.status = ConfigStatus.REJECTED;
        rule.approvedBy = new mongoose.Types.ObjectId(approverId);
        rule.approvedAt = new Date();
    
        return rule.save();
      }
    
      async delete(id: string) {
        const rule = await this.allowanceModel.findById(id);
        if (!rule) throw new NotFoundException('Allowance not found');
    
        return this.allowanceModel.deleteOne({ _id: id }).exec();
      }
//---------------------------------------------------------Phase 1 Signing Bonuses---------------------------------------------------------------------------------
 async createSigningBonus(
    createSigningBonusDto: CreateSigningBonusDto,
    // later: createdBy from auth
  ) {
    const { positionName, amount } = createSigningBonusDto;

    // Enforce unique positionName
    const existing = await this.signingBonusModel
      .findOne({ positionName })
      .exec();
    if (existing) {
      throw new BadRequestException(
        'Signing bonus for this position already exists',
      );
    }

    const doc = new this.signingBonusModel({
      positionName,
      amount,
      status: ConfigStatus.DRAFT,
      // createdBy: userId
    });

    return doc.save();
  }

  async findAllSigningBonuses(){
    return this.signingBonusModel.find().exec();
  }

  async findOneSigningBonus(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid signing bonus id');
    }

    const doc = await this.signingBonusModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Signing bonus not found');
    }

    return doc;
  }

  async updateSigningBonus(
    id: string,
    updateSigningBonusDto: UpdateSigningBonusDto,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid signing bonus id');
    }

    const doc = await this.signingBonusModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Signing bonus not found');
    }

    // Phase 1 rule: only edit while status is DRAFT
    if (doc.status !== ConfigStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft signing bonuses can be edited',
      );
    }

    if (updateSigningBonusDto.positionName !== undefined) {
      doc.positionName = updateSigningBonusDto.positionName;
    }

    if (updateSigningBonusDto.amount !== undefined) {
      doc.amount = updateSigningBonusDto.amount;
    }

    return doc.save();
  }
//---------------------------------------------------------Phase 1 Termination Benefits---------------------------------------------------------------------------------
async createTerminationBenefit(
    createTerminationBenefitsDto: CreateTerminationBenefitsDto,
    createdById: string,
  ) {
    const { name, amount, terms } = createTerminationBenefitsDto;

    // Ensure unique name
    const existing = await this.terminationBenefitsModel
      .findOne({ name })
      .exec();
    if (existing) {
      throw new BadRequestException(
        'Termination/resignation benefit with this name already exists',
      );
    }

    const doc = new this.terminationBenefitsModel({
      name,
      amount,
      terms,
      status: ConfigStatus.DRAFT,
      createdBy: createdById,
    });

    return doc.save();
  }

  async findAllTerminationBenefits() {
    return this.terminationBenefitsModel.find().exec();
  }

  async findOneTerminationBenefit(
    id: string,
  ){
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid termination benefit id');
    }

    const doc = await this.terminationBenefitsModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(
        'Termination/resignation benefit not found',
      );
    }

    return doc;
  }

  async updateTerminationBenefit(
    id: string,
    updateTerminationBenefitsDto: UpdateTerminationBenefitsDto,
  ){
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid termination benefit id');
    }

    const doc = await this.terminationBenefitsModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(
        'Termination/resignation benefit not found',
      );
    }

    // Phase 1 rule: only edit while status is DRAFT
    if (doc.status !== ConfigStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft termination/resignation benefits can be edited',
      );
    }

    if (updateTerminationBenefitsDto.name !== undefined) {
      doc.name = updateTerminationBenefitsDto.name;
    }

    if (updateTerminationBenefitsDto.amount !== undefined) {
      doc.amount = updateTerminationBenefitsDto.amount;
    }

    if (updateTerminationBenefitsDto.terms !== undefined) {
      doc.terms = updateTerminationBenefitsDto.terms;
    }

    return doc.save();
  }

//---------------------------------------------------------Phase 1 Tax Rules Services---------------------------------------------------------------------------------
async createTaxRule(createDto: CreateTaxRuleDto, createdBy: string) {
    const rule = new this.taxRulesModel({
      ...createDto,
      status: ConfigStatus.DRAFT,
      createdBy,
    });
    return rule.save();``
  }

  async findAllTaxRules() {
    return this.taxRulesModel
      .find()
      .populate('createdBy', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .exec();
  }
  async updateTaxRule(id: string, updateDto: UpdateTaxRuleDto) {
    const rule = await this.taxRulesModel.findById(id);
    if (!rule) throw new NotFoundException('Tax rule not found');
    if (rule.status === ConfigStatus.APPROVED|| rule.status === ConfigStatus.REJECTED) {
      throw new ForbiddenException('Approved tax rules cannot be modified');
    }
    Object.assign(rule, updateDto);
    return rule.save();
  }

  async findByTaxRuleId(id: string) {
    const rule = await this.taxRulesModel
      .findById(id)
      .populate('createdBy', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .exec();
    if (!rule) throw new NotFoundException('Tax rule not found');
    return rule;
  }
//---------------------------------------------------------Phase 2 Insurance Brackets Services---------------------------------------------------------------------------------
async createInsuranceBracket(createDto: CreateInsuranceBracketDto, createdBy: string) {
    // Check if bracket with same name and salary range already exists
    const existingBracket = await this.insuranceBracketsModel.findOne({
      name: createDto.name,
      minSalary: createDto.minSalary,
      maxSalary: createDto.maxSalary,
    });

    if (existingBracket) {
      throw new Error('Insurance bracket with same name and salary range already exists');
    }

    const bracket = new this.insuranceBracketsModel({
      ...createDto,
      status: ConfigStatus.DRAFT,
      createdBy: new mongoose.Types.ObjectId(createdBy),
    });

    return bracket.save();
  }

  async findAllInsuranceBracket() {
    return this.insuranceBracketsModel
      .find()
      .populate('createdBy', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .sort({ minSalary: 1 })
      .exec();
  }

  async updateInsuranceBracket(
    id: string,
    updateDto: UpdateInsuranceBracketDto,
     ) {
    const bracket = await this.insuranceBracketsModel.findById(id);
    if (!bracket) throw new NotFoundException('Insurance bracket not found');

    // Check if another bracket with same name and salary range exists (exclude current)
    const existingBracket = await this.insuranceBracketsModel.findOne({
      _id: { $ne: id },
      name: updateDto.name,
      minSalary: updateDto.minSalary,
      maxSalary: updateDto.maxSalary,
    });

    if (existingBracket) {
      throw new Error('Insurance bracket with same name and salary range already exists');
    }

    // Only apply provided fields, preserve existing values
    const updateData: Partial<UpdateInsuranceBracketDto> = {};
    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.minSalary !== undefined) updateData.minSalary = updateDto.minSalary;
    if (updateDto.maxSalary !== undefined) updateData.maxSalary = updateDto.maxSalary;
    if (updateDto.employeeRate !== undefined) updateData.employeeRate = updateDto.employeeRate;
    if (updateDto.employerRate !== undefined) updateData.employerRate = updateDto.employerRate;

    Object.assign(bracket, updateData);

    // Keep it in draft if edited (legal flow logic)
    bracket.status =
      bracket.status === ConfigStatus.APPROVED
        ? ConfigStatus.DRAFT
        : bracket.status;


    return bracket.save();
  }

  async findByInsuranceBracketId(id: string) {
    const bracket = await this.insuranceBracketsModel
      .findById(id)
      .populate('createdBy', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .exec();

    if (!bracket) throw new NotFoundException('Insurance bracket not found');

    return bracket;
  }
//---------------------------------------------------------Phase Company Wide Settings Services---------------------------------------------------------------------------------
 async createCompanyWideSettings(createDto: CreateCompanyWideSettingsDto) {
    // Enforce singleton pattern - only one record should exist
    const existingSettings = await this.companyWideSettingsModel.findOne();
    if (existingSettings) {
      throw new BadRequestException(
        'Company-wide settings already exist. Use update endpoint to modify.',
      );
    }

    const settings = new this.companyWideSettingsModel({
      payDate: new Date(createDto.payDate),
      timeZone: createDto.timeZone,
      currency: createDto.currency,
    });

    return settings.save();
  }

  async findAllCompanyWideSettings() {
    return this.companyWideSettingsModel.find().exec();
  }

  async findOneCompanyWideSettings() {
    const settings = await this.companyWideSettingsModel.findOne().exec();
    if (!settings) {
      throw new NotFoundException('Company-wide settings not found');
    }
    return settings;
  }

  async updateCompanyWideSettings(updateDto: UpdateCompanyWideSettingsDto) {
    const settings = await this.companyWideSettingsModel.findOne();
    if (!settings) {
      throw new NotFoundException('Company-wide settings not found. Please create settings first.');
    }

    // Update fields
    settings.payDate = new Date(updateDto.payDate);
    settings.timeZone = updateDto.timeZone;
    settings.currency = updateDto.currency;

    return settings.save();
  }
  //---------------------------------------------------------Backup Services---------------------------------------------------------------------------------
  async createBackup(adminName: string = 'Unkn'): Promise<{ dir: string; files: string[] }> {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDirName = `${timestamp}_${adminName.replace(/\s+/g, '_')}`;
      const backupDir = path.resolve(process.cwd(), 'backups', backupDirName);
      await fs.promises.mkdir(backupDir, { recursive: true });
  
      // Get list of collections
      const db = this.connection.db;
      if (!db) {
        throw new Error('No database connection available');
      }
      const collections = await db.listCollections().toArray();
  
      const files: string[] = [];
      for (const col of collections) {
        try {
          const name = col.name;
          this.logger.log(`Backing up collection: ${name}`);
          const cursor = db.collection(name).find();
  
          const outPath = path.join(backupDir, `${name}.json.gz`);
          const gzip = createGzip();
          const writeStream = fs.createWriteStream(outPath);
  
          // stream JSON array manually to avoid loading everything into memory
          const readable = this.cursorToJsonStream(cursor);
  
          await pipeline(readable, gzip, writeStream);
          files.push(outPath);
        } catch (err) {
          this.logger.error(`Failed to backup collection ${col.name}: ${err}`);
        }
      }
  
      return { dir: backupDir, files };
    }
  
    async listBackups(): Promise<string[]> {
      const base = path.resolve(process.cwd(), 'backups');
      try {
        const entries = await fs.promises.readdir(base, { withFileTypes: true });
        return entries.filter(e => e.isDirectory()).map(e => e.name).sort().reverse();
      } catch (err) {
        return [];
      }
    }
  
    private async *cursorToJsonStream(cursor: any) {
      // yield a stream of Buffer/strings representing a JSON array
      let started = false;
      yield Buffer.from('[');
      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        const str = JSON.stringify(doc);
        if (started) yield Buffer.from(',');
        yield Buffer.from(str);
        started = true;
      }
      yield Buffer.from(']');
    }
  
}
