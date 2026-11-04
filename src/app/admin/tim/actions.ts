'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { audit, requireAdmin, type Role } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendMail } from '@/lib/mail';
import { tempPassword } from '@/lib/passwords';

export type TeamState = { error: string | null; done?: string; temp?: string; who?: string };

const ROLES = ['REVIEWER', 'ACTIVATION', 'ADMIN'] as const;
const APP = () => process.env.APP_URL || 'https://beta.hausjo.co.id';

function welcomeMail(name: string, email: string, temp: string, reset: boolean) {
  return {
    subject: reset ? 'Kata sandi admin AIPOS diatur ulang' : 'Akun admin AIPOS Anda',
    text: `Halo ${name},\n\n${reset ? 'Kata sandi akun admin Anda sudah diatur ulang.' : 'Akun admin AIPOS sudah dibuat untuk Anda.'}\n\nMasuk di: ${APP()}/admin/masuk\nEmail: ${email}\nKata sandi sementara: ${temp}\n\nAnda akan diminta membuat kata sandi baru saat pertama masuk.\n\nAIPOS`
  };
}

/** At least one other active ADMIN must remain, so the team can never lock itself out. */
async function otherActiveAdmins(exceptId: string) {
  return db.admin.count({ where: { role: 'ADMIN', active: true, id: { not: exceptId } } });
}

export async function addMember(_prev: TeamState, form: FormData): Promise<TeamState> {
  const me = await requireAdmin(['ADMIN']);
  const parsed = z.object({
    name: z.string().trim().min(2, 'Isi nama'),
    email: z.string().trim().toLowerCase().email('Email tidak valid'),
    role: z.enum(ROLES)
  }).safeParse({ name: form.get('name'), email: form.get('email'), role: form.get('role') });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, role } = parsed.data;
  if (await db.admin.findUnique({ where: { email } })) return { error: 'Email ini sudah terdaftar sebagai admin' };
  const temp = tempPassword();
  const created = await db.admin.create({
    data: { name, email, role, passwordHash: await bcrypt.hash(temp, 12), mustChangePassword: true }
  });
  const m = welcomeMail(name, email, temp, false);
  await sendMail(email, m.subject, m.text);
  await audit(me.id, 'TEAM_ADD', undefined, `${created.email} · ${role}`);
  revalidatePath('/admin/tim');
  return { error: null, done: 'added', temp, who: name };
}

export async function resetMember(_prev: TeamState, form: FormData): Promise<TeamState> {
  const me = await requireAdmin(['ADMIN']);
  const target = await db.admin.findUnique({ where: { id: String(form.get('id')) } });
  if (!target) return { error: 'Akun tidak ditemukan' };
  if (target.id === me.id) return { error: 'Ganti kata sandi Anda sendiri di "Akun saya"' };
  const temp = tempPassword();
  await db.admin.update({
    where: { id: target.id },
    data: { passwordHash: await bcrypt.hash(temp, 12), mustChangePassword: true, passwordChangedAt: new Date() }
  });
  const m = welcomeMail(target.name, target.email, temp, true);
  await sendMail(target.email, m.subject, m.text);
  await audit(me.id, 'TEAM_RESET', undefined, target.email);
  revalidatePath('/admin/tim');
  return { error: null, done: 'reset', temp, who: target.name };
}

export async function updateMember(_prev: TeamState, form: FormData): Promise<TeamState> {
  const me = await requireAdmin(['ADMIN']);
  const target = await db.admin.findUnique({ where: { id: String(form.get('id')) } });
  if (!target) return { error: 'Akun tidak ditemukan' };
  const role = String(form.get('role') || target.role) as Role;
  const active = form.get('active') === null ? target.active : form.get('active') === '1';
  if (!ROLES.includes(role)) return { error: 'Peran tidak valid' };
  if (target.id === me.id && (role !== 'ADMIN' || !active)) return { error: 'Anda tidak bisa menurunkan peran atau menonaktifkan akun sendiri' };
  const losesAdmin = target.role === 'ADMIN' && target.active && (role !== 'ADMIN' || !active);
  if (losesAdmin && (await otherActiveAdmins(target.id)) === 0) return { error: 'Harus ada minimal satu Admin aktif' };
  await db.admin.update({
    where: { id: target.id },
    // Deactivating also ends their open sessions.
    data: { role, active, ...(target.active && !active ? { passwordChangedAt: new Date() } : {}) }
  });
  await audit(me.id, 'TEAM_UPDATE', undefined, `${target.email} · ${role} · ${active ? 'aktif' : 'nonaktif'}`);
  revalidatePath('/admin/tim');
  return { error: null, done: active ? 'saved' : 'deactivated', who: target.name };
}
