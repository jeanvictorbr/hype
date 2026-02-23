const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'eco_submit_banlog_',

    async execute(interaction, client) {
        await interaction.deferUpdate();
        const guildId = interaction.customId.split('_').pop();
        const channelId = interaction.values[0];

        try {
            await prisma.vipConfig.upsert({
                where: { guildId },
                update: { banRequestChannel: channelId },
                create: { guildId, banRequestChannel: channelId }
            });

            await interaction.editReply({ content: `✅ Sucesso! As solicitações de banimento agora serão enviadas para <#${channelId}>.`, components: [] });
        } catch (error) {
            console.error(error);
        }
    }
};