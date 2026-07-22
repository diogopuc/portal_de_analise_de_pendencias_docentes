import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { IDocenteRepository } from '../domain/repositories/IDocenteRepository';

function sanitizarNome(nome: string, matricula: number): string {
  const s = nome
    .toUpperCase()
    .replace(/\s+/g, '_')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9_]/g, '')
    .substring(0, 100);
  return `${s}_${matricula}.pdf`;
}

export function emailRoutes(repositorio: IDocenteRepository, relatoriosDir: string): Router {
  const router = Router();

  router.post('/enviar', async (req: Request, res: Response) => {
    try {
      const { matricula, email, assunto, corpo } = req.body as {
        matricula: number;
        email: string;
        assunto?: string;
        corpo?: string;
      };

      if (!matricula || !email) {
        return res.status(400).json({ erro: 'matricula e email são obrigatórios.' });
      }

      const docente = repositorio.encontrarPorMatricula(Number(matricula));
      if (!docente) {
        return res.status(404).json({ erro: 'Docente não encontrado.' });
      }

      const nomeArquivo = sanitizarNome(docente.nomeDocente, docente.matricula);
      const pdfPath = path.join(relatoriosDir, nomeArquivo);

      if (!fs.existsSync(pdfPath)) {
        return res.status(404).json({ erro: `PDF não encontrado: ${nomeArquivo}. Gere o relatório primeiro.` });
      }

      const transporter = nodemailer.createTransport({
        host:   process.env.SMTP_HOST  || 'smtp.gmail.com',
        port:   Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      });

      const assuntoFinal = assunto || `Relatório de Pendências — ${docente.nomeDocente}`;
      const corpoFinal   = corpo   || `Prezado(a),\n\nSegue em anexo o relatório de pendências de ${docente.nomeDocente} (matrícula ${docente.matricula}).\n\nAtenciosamente,\nGPCA — PUCPR`;

      await transporter.sendMail({
        from:        process.env.EMAIL_FROM || process.env.SMTP_USER,
        to:          email,
        subject:     assuntoFinal,
        text:        corpoFinal,
        attachments: [{ filename: nomeArquivo, path: pdfPath }],
      });

      res.json({ sucesso: true, mensagem: `E-mail enviado para ${email}.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ erro: `Erro ao enviar e-mail: ${msg}` });
    }
  });

  return router;
}
