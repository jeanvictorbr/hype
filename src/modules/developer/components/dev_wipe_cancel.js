module.exports = {
    customId: 'dev_wipe_cancel',

    async execute(interaction) {
        // Apenas substitui a mensagem
        await interaction.update({ 
            content: '✅ **Operação Abortada.** A economia foi poupada... por enquanto.', 
            components: [] 
        });
    }
};