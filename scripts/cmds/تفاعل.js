const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'cache', 'autoReactionConfig.json');

const getConfig = () => {
    try {
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
    } catch (e) {}
    return {};
};

const saveConfig = (data) => {
    try {
        const dir = path.dirname(configPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {}
};

module.exports = {
    config: {
        name: "تفاعل",
        aliases: ["تشغيل", "ايقاف", "تفاعل"],
        version: "5.1",
        author: "MahMUD & Fares",
        countDown: 1,
        role: 0,
        description: {
            ar: "تشغيل أو إيقاف التفاعل التلقائي السريع لجميع أعضاء المجموعة ⚡"
        },
        category: "box",
        guide: {
            ar: '   {pn} تفاعل on <الإيموجي>\n   {pn} تفاعل off'
        }
    },

    langs: {
        ar: {
            usageError: "⚠️ | الاستخدام الصحيح:\n• للتفعيل: تفاعل on 💋\n• للإيقاف: تفاعل off",
            enabled: "✅ | تم تفعيل التفاعل التلقائي للجميع بنجاح بالإيموجي: %1",
            disabled: "🛑 | تم إيقاف التفاعل التلقائي بنجاح."
        }
    },

    onStart: async function ({ api, event, args, getLang }) {
        const { threadID, messageID, body } = event;
        const subCommand = (args[0] || "").toLowerCase();
        const config = getConfig();

        if (subCommand === "on") {
            const emojiMatch = body ? body.match(/[\p{Extended_Pictographic}]/u) : null;
            const selectedEmoji = emojiMatch ? emojiMatch[0] : "🌸";

            config[threadID] = {
                status: true,
                emoji: selectedEmoji
            };
            saveConfig(config);
            return api.sendMessage(getLang("enabled").replace("%1", selectedEmoji), threadID, messageID);
        } 
        else if (subCommand === "off") {
            if (config[threadID]) {
                config[threadID].status = false;
                saveConfig(config);
            }
            return api.sendMessage(getLang("disabled"), threadID, messageID);
        } 
        else {
            return api.sendMessage(getLang("usageError"), threadID, messageID);
        }
    },

    handleEvent: async function ({ api, event }) {
        try {
            const { threadID, messageID, senderID, body } = event;
            if (!threadID || senderID === api.getCurrentUserID()) return;

            const config = getConfig();
            const threadConfig = config[threadID];

            // 1. التفاعل التلقائي للمجموعة بالإيموجي المحدد مسبقاً عند تفعيله
            if (threadConfig && threadConfig.status === true && threadConfig.emoji) {
                api.setMessageReaction(threadConfig.emoji, messageID, () => {}, true);
            }

            // 2. الرد بنفس الإيموجي إذا أرسل المستخدم إيموجي منفرداً
            if (body) {
                const trimmedBody = body.trim();
                const emojiRegex = /^[\p{Extended_Pictographic}]$/u;
                if (emojiRegex.test(trimmedBody)) {
                    api.setMessageReaction(trimmedBody, messageID, () => {}, true);
                }
            }
        } catch (e) {}
    }
};
