module.exports = {
    customId: 'dev_wipe_cd_cancel',

    async execute(interaction) {
        await interaction.update({ 
            content: '✅ **Operação Abortada.** Os tempos de recarga continuam normais.', 
            components: [] 
        });
    }
};