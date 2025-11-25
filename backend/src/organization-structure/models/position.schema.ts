import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types, UpdateQuery, model } from 'mongoose';
import { Department, DepartmentDocument } from './department.schema';

export type PositionDocument = HydratedDocument<Position>;

@Schema({ collection: 'positions', timestamps: true })
export class Position {
  @Prop({ type: String, required: true, unique: true })
  code: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  departmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Position' })
  reportsToPositionId?: Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const PositionSchema = SchemaFactory.createForClass(Position);

async function resolveDepartmentHead(
  departmentModel: Model<DepartmentDocument>,
  departmentId?: Types.ObjectId | string,
  positionId?: Types.ObjectId,
) {
  if (!departmentId) {
    return undefined;
  }

  const department = await departmentModel
    .findById(departmentId)
    .select('headPositionId')
    .lean()
    .exec();

  if (!department?.headPositionId) {
    return undefined;
  }

  if (positionId && department.headPositionId.equals(positionId)) {
    return undefined;
  }

  return department.headPositionId;
}

function isPositionUpdate(update: unknown): update is UpdateQuery<Position> {
  return (
    Boolean(update) && typeof update === 'object' && !Array.isArray(update)
  );
}

function isObjectIdLike(value: unknown): value is Types.ObjectId | string {
  return typeof value === 'string' || value instanceof Types.ObjectId;
}

PositionSchema.pre('save', async function (next) {
  try {
    const doc = this as HydratedDocument<Position>;
    const DepartmentModel = model<DepartmentDocument>(Department.name);
    doc.reportsToPositionId = await resolveDepartmentHead(
      DepartmentModel,
      doc.departmentId,
      doc._id,
    );
    next();
  } catch (error) {
    next(error as Error);
  }
});

PositionSchema.pre('findOneAndUpdate', async function (next) {
  try {
    const rawUpdate = this.getUpdate();
    if (!isPositionUpdate(rawUpdate)) {
      return next();
    }

    const update = rawUpdate;

    let departmentId: Types.ObjectId | string | undefined;

    if (isObjectIdLike(update.departmentId)) {
      departmentId = update.departmentId;
    } else if (update.$set && isObjectIdLike(update.$set.departmentId)) {
      departmentId = update.$set.departmentId;
    }

    if (!departmentId) {
      const current = await this.model
        .findOne(this.getQuery())
        .select('departmentId')
        .lean<{ departmentId?: Types.ObjectId }>()
        .exec();
      departmentId = current?.departmentId;
    }

    if (!departmentId) {
      return next();
    }

    const DepartmentModel = this.model.db.model<DepartmentDocument>(
      Department.name,
    );

    const normalizedDepartmentId =
      typeof departmentId === 'string'
        ? new Types.ObjectId(departmentId)
        : departmentId;

    const headId = await resolveDepartmentHead(
      DepartmentModel,
      normalizedDepartmentId,
      (this.getQuery()._id as Types.ObjectId) || undefined,
    );

    if (update.$set) {
      update.$set.reportsToPositionId = headId;
    } else {
      update.$set = {
        reportsToPositionId: headId,
      } as UpdateQuery<Position>['$set'];
    }

    this.setUpdate(update);
    next();
  } catch (error) {
    next(error as Error);
  }
});
