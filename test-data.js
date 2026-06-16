// Cole este script no Console do navegador (F12 → Console) para gerar dados de teste
(() => {
    const cargaHoraria = {
        entrada: '08:00',
        idaIntervalo: '12:00',
        voltaIntervalo: '13:00',
        saida: '17:00'
    };

    const registros = [
        {
            data: '2026-06-16',
            entrada: '08:00',
            idaIntervalo: '12:00',
            voltaIntervalo: '13:00',
            saida: '17:30'
        },
        {
            data: '2026-06-17',
            entrada: '08:15',
            idaIntervalo: '12:00',
            voltaIntervalo: '13:00',
            saida: '17:00'
        },
        {
            data: '2026-06-18',
            entrada: '07:50',
            idaIntervalo: '12:00',
            voltaIntervalo: '13:00',
            saida: '16:40'
        }
    ];

    const usuario = {
        nome: 'Usuário',
        pin: '0000'
    };

    localStorage.setItem('cargaHoraria', JSON.stringify(cargaHoraria));
    localStorage.setItem('registros', JSON.stringify(registros));
    localStorage.setItem('usuario', JSON.stringify(usuario));

    console.log('✅ Dados de teste gerados com sucesso!');
    console.log('📊 Resumo dos 3 dias:');
    console.log('   Dia 1 (16/06): 08:00 → 17:30 = +00:30');
    console.log('   Dia 2 (17/06): 08:15 → 17:00 = -00:15');
    console.log('   Dia 3 (18/06): 07:50 → 16:40 = -00:10');
    console.log('   Total banco: +00:05');
    console.log('');
    console.log('Recarregue a página para ver os dados.');
})();
