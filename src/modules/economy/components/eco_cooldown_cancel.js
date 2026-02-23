module.exports = {
    customId: 'eco_cooldown_cancel',
    async execute(interaction, client) {
        await interaction.update({ content: '❌ Operação cancelada. Nenhuma alteração foi feita.', embeds: [], components: [] });
    }
};