import { Controller, Get, Post, Patch, Put, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ConfigurationService } from './payroll-configuration.service';
import { CreateAllowanceDto } from './dtos/create-allowance.dto';
import { UpdateAllowanceDto } from './dtos/update-allowance.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/decorators/roles.decorator';
import { authorizationGuard } from '../auth/guards/authorization.guard';
import { AuthGuard } from '../auth/guards/authentication.guard';
import { CreatePayrollPolicyDto } from './dtos/create-payroll-policy.dto';
import { UpdatePayrollPolicyDto } from './dtos/update-payroll-policy.dto';
import { CreatePayGradeDto } from './dtos/create-pay-grade.dto';
import { UpdatePayGradeDto } from './dtos/update-pay-grade.dto';
import { CreatePayTypeDto } from './dtos/create-pay-type.dto';
import { UpdatePayTypeDto } from './dtos/update-pay-type.dto';
import { CreateSigningBonusDto } from './dtos/create-signing-bonus.dto';
import { UpdateSigningBonusDto } from './dtos/update-signing-bonus.dto';
import { CreateTerminationBenefitsDto } from './dtos/create-termination-benefits.dto';
import { UpdateTerminationBenefitsDto } from './dtos/update-termination-benefits.dto';
import { CreateTaxRuleDto } from './dtos/CreateTaxRuleDto';
import { UpdateTaxRuleDto } from './dtos/UpdateTaxRuleDto';
import { CreateInsuranceBracketDto } from './dtos/CreateInsuranceBracketDto';
import { UpdateInsuranceBracketDto } from './dtos/UpdateInsuranceBracketDto';
import { CreateCompanyWideSettingsDto } from './dtos/CreateCompanyWideSettingsDto';
import { UpdateCompanyWideSettingsDto } from './dtos/UpdateCompanyWideSettingsDto';
@Controller('ConfigurationService')
@UseGuards(AuthGuard, authorizationGuard)
export class PayrollConfigurationController {
  constructor(
    private readonly ConfigurationService: ConfigurationService,
  ) {}

  // Generic endpoints for viewing all configuration types (Payroll Manager)
  //--------------------------Phase 1 Payroll Policies---------------------------------------------------------------------------------------------------------------------
  @Post()
   @Roles(Role.PAYROLL_SPECIALIST)
   async createPayrollPolicy(
     @Body() createPayrollPolicyDto: CreatePayrollPolicyDto,
     @Req() req: Request,
   ){
     const user = req['user'];
     const createdById = user.sub;
     return this.ConfigurationService.createPayrollPolicy(
       createPayrollPolicyDto,
       createdById,
     );
   }
 
   @Get()
   @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
   async getAllPayrollPolicies() {
     return this.ConfigurationService.findAllPayrollPolicies();
   }
 
   @Get(':id')
   @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
   async getPayrollPolicyById(
     @Param('id') id: string,
   ){
     return this.ConfigurationService.findOnePayrollPolicy(id);
   }
 
   @Patch(':id')
   @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
   async updatePayrollPolicy(
     @Param('id') id: string,
     @Body() updatePayrollPolicyDto: UpdatePayrollPolicyDto,
   ){
     return this.ConfigurationService.updatePayrollPolicy(
       id,
       updatePayrollPolicyDto,
     );
   }
  //-----------------------------Phase 1 Pay-Grade----------------------------------------------------------------------------------------------------------------------
   @Roles(Role.PAYROLL_SPECIALIST)
    @Post()
    async createPayGrade(
      @Body() createPayGradeDto: CreatePayGradeDto,
      @Req() req: Request,
    ){
      const user = req['user'];
      const createdById = user.sub;
      return this.ConfigurationService.createPayGrade(createPayGradeDto, createdById);
    }
  
    @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
    @Get()
    async getAllPayGrades(){
      return this.ConfigurationService.findAllPayGrades();
    }
  
    @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
    @Get(':id')
    async getPayGradeById(@Param('id') id: string){
      return this.ConfigurationService.findOnePayGrade(id);
    }
  
    @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
    @Patch(':id')
    async updatePayGrade(
      @Param('id') id: string,
      @Body() updatePayGradeDto: UpdatePayGradeDto,
    ){
      return this.ConfigurationService.updatePayGrade(id, updatePayGradeDto);
    }
  //---------------------------Phase 1 Pay-type----------------------------------------------------------------------------------------------
   @Roles(Role.PAYROLL_SPECIALIST)
      @Post()
      async createPayType(
        @Body() createPayTypeDto: CreatePayTypeDto,
        @Req() req: Request,
      ){
        const user = req['user'];
        const createdById = user.sub;
        return this.ConfigurationService.createPayType(createPayTypeDto, createdById);
      }
    
      @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
      @Get()
      async getAllPayTypes() {
        return this.ConfigurationService.findAllPayTypes();
      }
    
      @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
      @Get(':id')
      async getPayTypeById(
        @Param('id') id: string,
      ){
        return this.ConfigurationService.findOnePayType(id);
      }
    
      @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
      @Patch(':id')
      async updatePayType(
        @Param('id') id: string,
       @Body() updatePayTypeDto: UpdatePayTypeDto,
      ){
        return this.ConfigurationService.updatePayType(id, updatePayTypeDto);
      }
  //--------------------------Phase 1 Allowances---------------------------------------------------------------------------------------------------------------------
   @Roles(Role.PAYROLL_SPECIALIST)
  @Post()
  async createAllowance(
    @Body() createAllowanceDto: CreateAllowanceDto,
    @Req() req: Request,
  ){
    const user = req['user'];
    const createdById = user.sub;
    return this.ConfigurationService.createAllowance(createAllowanceDto, createdById);
  }

  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  @Get()
  async getAllAllowances() {
    return this.ConfigurationService.findAllAllowances();
  }

  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  @Get(':id')
  async getAllowanceById(
    @Param('id') id: string,
  ){
    return this.ConfigurationService.findOneAllowance(id);
  }

  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  @Patch(':id')
  async updateAllowance(
    @Param('id') id: string,
    @Body() updateAllowanceDto: UpdateAllowanceDto,
  ){
    return this.ConfigurationService.updateAllowance(id, updateAllowanceDto);
  }

  //--------------------------Phase 4 Payroll manager approval---------------------------------------------------------------------------------------------------------------------
  @Post(':id/approve')
  @Roles(Role.Payroll_MANAGER)
  async approve(@Param('id') id: string, @Req() req: any) {
    const approverId = req.user?._id;
    return this.ConfigurationService.approve(id, approverId);
  }

  @Post(':id/reject')
  @Roles(Role.Payroll_MANAGER)
  async reject(@Param('id') id: string, @Req() req: any) {
    const approverId = req.user?._id;
    return this.ConfigurationService.reject(id, approverId);
  }

  @Delete(':id')
  @Roles(Role.Payroll_MANAGER)
  async delete(@Param('id') id: string) {
    return this.ConfigurationService.delete(id);
  }


//---------------------------------------------------------Phase 1 Signing Bonuses---------------------------------------------------------------------------------
  @Post()
  @Roles(Role.PAYROLL_SPECIALIST)
    async createSigningBonus(
    @Body() createSigningBonusDto: CreateSigningBonusDto,
  ){
    return this.ConfigurationService.createSigningBonus(
      createSigningBonusDto,
    );
  }
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  @Get()
  async getAllSigningBonuses(){
    return this.ConfigurationService.findAllSigningBonuses();
  }
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  @Get(':id')
  async getSigningBonusById(
    @Param('id') id: string,
  ){
    return this.ConfigurationService.findOneSigningBonus(id);
  }

  @Patch(':id')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async updateSigningBonus(
    @Param('id') id: string,
    @Body() updateSigningBonusDto: UpdateSigningBonusDto,
  ){
    return this.ConfigurationService.updateSigningBonus(
      id,
      updateSigningBonusDto,
    );
  }
  //--------------------------Phase 1 Termination and Resignation Benefits---------------------------------------------------------------------------------------------------------------------
 @Post()
  @Roles(Role.PAYROLL_SPECIALIST)
  async createTerminationBenefit(
    @Body() createTerminationBenefitsDto: CreateTerminationBenefitsDto,
    @Req() req: Request,
  ){
    const user = req['user'];
    const createdById = user.sub;
    return this.ConfigurationService.createTerminationBenefit(
      createTerminationBenefitsDto,
      createdById,
    );
  }

  @Get()
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async getAllTerminationBenefits() {
    return this.ConfigurationService.findAllTerminationBenefits();
  }

  @Get(':id')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async getTerminationBenefitById(
    @Param('id') id: string,
  ){
    return this.ConfigurationService.findOneTerminationBenefit(id);
  }

  @Patch(':id')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async updateTerminationBenefit(
    @Param('id') id: string,
    @Body() updateTerminationBenefitsDto: UpdateTerminationBenefitsDto,
  ){
    return this.ConfigurationService.updateTerminationBenefit(
      id,
      updateTerminationBenefitsDto,
    );
  }
//---------------------------------------------------------Phase 2 Tax-Rules-----------------------------------------------------------------------------------------------------------------
  @Post()
  @Roles(Role.LEGAL_POLICY_ADMIN,)
  async create(@Body() dto: CreateTaxRuleDto, @Req() req: any) {
    const createdBy = req.user?._id;
    return this.ConfigurationService.createTaxRule(dto, createdBy);
  }

  @Get()
  @Roles(Role.LEGAL_POLICY_ADMIN, Role.Payroll_MANAGER)
  async findAll() {
    return this.ConfigurationService.findAllTaxRules();
  }

  @Get(':id')
  @Roles(Role.LEGAL_POLICY_ADMIN, Role.Payroll_MANAGER)
  async findTById(@Param('id') id: string) {
    return this.ConfigurationService.findByTaxRuleId(id);
  }

  @Patch(':id')
  @Roles( Role.Payroll_MANAGER)
  async updateTaxRule(
    @Param('id') id: string,
    @Body() dto: UpdateTaxRuleDto,
    @Req() req: any,
  ) {
    return this.ConfigurationService.updateTaxRule(id, dto);
  }
//---------------------------------------------------------Phase 2 Insurance Bracket-------------------------------------------------------------------------------------------------
 @Post()
  @Roles(Role.PAYROLL_SPECIALIST)
  async createInsuranceBracket(@Body() dto: CreateInsuranceBracketDto, @Req() req: any) {
    const createdBy = req.user?._id;
    return this.ConfigurationService.createInsuranceBracket(dto, createdBy);
  }

  @Get()
  @Roles(Role.PAYROLL_SPECIALIST, Role.HR_MANAGER)
  async findAllInsuranceBracket() {
    return this.ConfigurationService.findAllInsuranceBracket();
  }

  @Get(':id')
  @Roles(Role.PAYROLL_SPECIALIST, Role.HR_MANAGER)
  async findByInsuranceBracketId(@Param('id') id: string) {
    return this.ConfigurationService.findByInsuranceBracketId(id);
  }

  @Put(':id')
  @Roles(Role.PAYROLL_SPECIALIST, Role.HR_MANAGER)
  async updateInsuranceBracket(
    @Param('id') id: string,
    @Body() dto: UpdateInsuranceBracketDto,
    @Req() req: any,
  ) {

    return this.ConfigurationService.updateInsuranceBracket(id, dto);
  }
//---------------------------------------------------------Phase 3 Company Wide Settings---------------------------------------------------------------------------------
 @Post()
  async createCompanyWideSettings(@Body() dto: CreateCompanyWideSettingsDto) {
    return this.ConfigurationService.createCompanyWideSettings(dto);
  }

  @Get()
  async findAllCompanyWideSettings() {
    return this.ConfigurationService.findAllCompanyWideSettings();
  }

  @Get('current')
  async findCurrentCompanyWideSettings() {
    return this.ConfigurationService.findOneCompanyWideSettings();
  }

  @Put()
  async updateCompanyWideSettings(@Body() dto: UpdateCompanyWideSettingsDto) {
    return this.ConfigurationService.updateCompanyWideSettings(dto);
  }
  //---------------------------------------------------------Phase 3 Backup---------------------------------------------------------------------------------
   @Post()
  async createBackup(@Req() req: any) {
    const adminName = req.user?.fullName || 'Unknown';
    return this.ConfigurationService.createBackup(adminName);
  }

  @Get()
  async listBackups() {
    return this.ConfigurationService.listBackups();
  }
}