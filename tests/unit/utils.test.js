import { describe, it, expect } from 'vitest';

function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const abs = Math.abs(totalMinutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function calcularCarga(carga) {
  const entrada = timeToMinutes(carga.entrada);
  const saida = timeToMinutes(carga.saida);
  const ida = timeToMinutes(carga.idaIntervalo);
  const volta = timeToMinutes(carga.voltaIntervalo);
  const total = (saida - entrada) - (volta - ida);
  return minutesToTime(total);
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

describe('timeToMinutes', () => {
  it('converte 08:00 para 480', () => expect(timeToMinutes('08:00')).toBe(480));
  it('converte 17:30 para 1050', () => expect(timeToMinutes('17:30')).toBe(1050));
  it('converte 00:00 para 0', () => expect(timeToMinutes('00:00')).toBe(0));
});

describe('minutesToTime', () => {
  it('converte 480 para 08:00', () => expect(minutesToTime(480)).toBe('08:00'));
  it('converte 1050 para 17:30', () => expect(minutesToTime(1050)).toBe('17:30'));
  it('lida com valor negativo', () => expect(minutesToTime(-30)).toBe('00:30'));
});

describe('calcularCarga', () => {
  it('calcula 8h para 08-12/13-17', () => {
    expect(calcularCarga({ entrada: '08:00', idaIntervalo: '12:00', voltaIntervalo: '13:00', saida: '17:00' })).toBe('08:00');
  });
  it('calcula 6h para 09-12/13-16', () => {
    expect(calcularCarga({ entrada: '09:00', idaIntervalo: '12:00', voltaIntervalo: '13:00', saida: '16:00' })).toBe('06:00');
  });
  it('calcula 2h para 14-15/15:30-16:30', () => {
    expect(calcularCarga({ entrada: '14:00', idaIntervalo: '15:00', voltaIntervalo: '15:30', saida: '16:30' })).toBe('02:00');
  });
});

describe('formatDate', () => {
  it('converte 2026-06-16 para 16/06/2026', () => expect(formatDate('2026-06-16')).toBe('16/06/2026'));
  it('converte 2024-01-01 para 01/01/2024', () => expect(formatDate('2024-01-01')).toBe('01/01/2024'));
});
