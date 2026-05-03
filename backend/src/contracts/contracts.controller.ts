import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { ContractsService } from './contracts.service';
import { ConfirmSignatureDto } from './dto/confirm-signature.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { JwtAuthGuard } from '../auth/guards/auth-jwt.guard';
import { User } from '../users/entities/user.entity';

type RequestWithUser = Request & {
  user: User;
};

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createContractDto: CreateContractDto,
    @Req() req: RequestWithUser,
  ) {
    return this.contractsService.create(createContractDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.contractsService.findAll(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats/summary')
  getStats(@Req() req: RequestWithUser) {
    return this.contractsService.getSummaryStats(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('expiring-soon')
  findExpiringSoon(@Req() req: RequestWithUser) {
    return this.contractsService.findExpiringSoon(req.user);
  }

  @Get('signature/:token')
  findForSignature(@Param('token') token: string) {
    return this.contractsService.findBySignatureToken(token);
  }

  @Post('signature/:token/confirm')
  confirmSignature(
    @Param('token') token: string,
    @Body() confirmSignatureDto: ConfirmSignatureDto,
  ) {
    return this.contractsService.confirmSignature(token, confirmSignatureDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/template')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.contractsService.renderTemplate(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/pdf')
  async downloadPdf(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const pdf = await this.contractsService.buildPdf(id, req.user);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="contrat-${id}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/send-signature-email')
  sendSignatureEmail(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.contractsService.sendSignatureRequest(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.contractsService.findOne(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContractDto: UpdateContractDto,
    @Req() req: RequestWithUser,
  ) {
    return this.contractsService.update(id, updateContractDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.contractsService.remove(id, req.user);
  }
}
