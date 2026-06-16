import { describe, it, expect } from 'vitest';

function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function calcularDiffDia(reg, cargaDiariaMin) {
  const entrada = timeToMinutes(reg.entrada);
  const saida = timeToMinutes(reg.saida);
  let intervalo = 0;
  if (reg.idaIntervalo && reg.voltaIntervalo) {
    intervalo = timeToMinutes(reg.voltaIntervalo) - timeToMinutes(reg.idaIntervalo);
  }
  const trabalhado = (saida - entrada) - intervalo;
  return trabalhado - cargaDiariaMin;
}

const CARGA_PADRAO = 480; // 8h em minutos

describe('calcularDiffDia', () => {
  it('hora extra: 08:00-12:00/13:00-17:30 = +30min', () => {
    const diff = calcularDiffDia(
      { entrada: '08:00', idaIntervalo: '12:00', voltaIntervalo: '13:00', saida: '17:30' },
      CARGA_PADRAO
    );
    expect(diff).toBe(30);
  });

  it('hora faltante: 08:15-12:00/13:00-17:00 = -15min', () => {
    const diff = calcularDiffDia(
      { entrada: '08:15', idaIntervalo: '12:00', voltaIntervalo: '13:00', saida: '17:00' },
      CARGA_PADRAO
    );
    expect(diff).toBe(-15);
  });

  it('dia exato: 08:00-12:00/13:00-17:00 = 0min', () => {
    const diff = calcularDiffDia(
      { entrada: '08:00', idaIntervalo: '12:00', voltaIntervalo: '13:00', saida: '17:00' },
      CARGA_PADRAO
    );
    expect(diff).toBe(0);
  });

  it('sem intervalo: 08:00-17:00 = +60min (1h a mais sem intervalo)', () => {
    const diff = calcularDiffDia(
      { entrada: '08:00', idaIntervalo: null, voltaIntervalo: null, saida: '17:00' },
      CARGA_PADRAO
    );
    expect(diff).toBe(60);
  });
});
