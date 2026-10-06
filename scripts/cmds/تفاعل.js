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
        aliases: ["تشغيل", "ايقاف"],
        version: "6.0",
        author: "Fares Kouachi",
        countDown: 1,
        role: 0,
        description: {
            ar: "تشغيل أو إيقاف التفاعل التلقائي السريع لجميع أعضاء المجموعة بإيموجي مخصص ⚡"
        },
        category: "box",
        guide: {
            ar: '   {pn} تفاعل on <الإيموجي>\n   {pn} تفاعل off'
        }
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID, body } = event;
        const subCommand = (args[0] || "").toLowerCase();
        const config = getConfig();

        if (subCommand === "on") {
            // استخراج الإيموجي بدقة عالية من الكلمة الثانية أو من النص كاملاً
            let emoji = args[1];
            if (!emoji) {
                const match = body ? body.match(/[\p{Extended_Pictographic}]/u) : null;
                emoji = match ? match[0] : "🙂";
            }

            config[threadID] = {
                status: true,
                emoji: emoji
            };
            saveConfig(config);
            return api.sendMessage(`✅ | تم تفعيل التفاعل التلقائي بنجاح بالإيموجي: ${emoji}`, threadID, messageID);
        } 
        else if (subCommand === "off") {
            if (config[threadID]) {
                config[threadID].status = false;
                saveConfig(config);
            }
            return api.sendMessage(`🛑 | تم إيقاف التفاعل التلقائي بنجاح.`, threadID, messageID);
        } 
        else {
            return api.sendMessage(`⚠️ | الاستخدام الصحيح:\n• للتفعيل: تفاعل on 🙂\n• للإيقاف: تفاعل off`, threadID, messageID);
        }
    },

    handleEvent: async function ({ api, event }) {
        try {
            const { threadID, messageID, senderID, body } = event;
            if (!threadID || senderID === api.getCurrentUserID()) return;

            const config = getConfig();
            const threadConfig = config[threadID];

            // 1. التفاعل التلقائي لرسائل المجموعة بالإيموجي المحفوظ
            if (threadConfig && threadConfig.status === true && threadConfig.emoji) {
                api.setMessageReaction(threadConfig.emoji, messageID, () => {}, true);
            }

            // 2. الرد الفوري بنفس الإيموجي إذا أرسل أحدهم إيموجي منفرداً
            if (body) {
                const trimmed = body.trim();
                const singleEmojiRegex = /^[\p{Extended_Pictographic}]$/u;
                if (singleEmojiRegex.test(trimmed)) {
                    api.setMessageReaction(trimmed, messageID, () => {}, true);
                }
            }
        } catch (e) {}
    }
};
