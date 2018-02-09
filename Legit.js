
const config = require("./config.json");
const Discord = require("discord.js");
const fs = require("fs");
const prefix = config.prefix;

const bot = new Discord.Client({disableEveryone: true});
bot.commands = new Discord.Collection();

fs.readdir("./cmds/", (err, files) => {
    if(err) console.error(err);

    let jsFiles = files.filter(f => f.split(",").pop() === "js");
    if(jsFiles.lenght <= 0) {
        console.log("No commands to load!");
        return;
    }

    console.log(`Loading ${jsFiles.length} commands!`);

    jsFiles.forEach((f, i) => {
        let props = require(`./cmds/${f}`);
        console.log(`${i + 1}: ${f} Loaded!`);
        bot.commands.set(f, props);
    });
});

bot.on("ready", async () => {
    console.log(`Bot is ready! ${bot.user.username}`);
    console.log(bot.command);
    bot.user.setGame(`Legit!`, `https://www.twitch.tv/hawkvsgames?from-redirect=true`);

    try {
        let link = await bot.generateInvite(["ADMINISTRATOR"]);
        console.log(link);
    } catch(e) {
        config.log(e.stack);
    }
});

bot.on("message", async message => {
    if(message.author.bot) return;
    if(message.channel.type === "dm") return;
    
    //Userinfo command
    let array = message.content.split(" ");
    let command = array[0];
    let args = array.slice(1);

    if(!command.startsWith(prefix)) return;

    if(command === `${prefix}userinfo`) {
        let embed = new Discord.RichEmbed()
            .setAuthor("User Information")
            .addBlankField()
            .setThumbnail(message.author.avatarURL)
            .setColor("#ce0000")
            .setFooter("Work in progress!")
            .addField("Full Name", message.author.tag, true)
            .addField("ID", message.author.id, true)
            .addField("Satus", message.author.presence.status)
            .addField("Registered", message.author.createdAt);

        message.channel.sendEmbed(embed);

        return;

    }
    
    //Mute command
    if(command === `${prefix}mute`) {
        if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.reply("You don't have permission to use that command!");
        

        let toMute = message.guild.member(message.mentions.users.first()) || message.guild.members.get(args[0]); 
        if(!toMute) return message.reply("You did not specify a user!");

        if(toMute.id === message.author.id) return message.reply("You can't mute yourself");
        if(toMute.highestRole.position >= message.member.highestRole.position) return message.reply("You can't mute that user!");

        let role = message.guild.roles.find(r => r.name === "Legit Mute");
        if(!role) {
            try{
                role = await message.guild.createRole({
                    name: "Legit Mute",
                    color: "#000000",
                    permissions: []
                });

                message.guild.channels.forEach(async (channel, id) => {
                    await channel.overwritePermissions(role, {
                        SEND_MESSAGES: false,
                        ADD_REACTIONS: false
                    });
                });
            } catch(e) {
                console.log(e.stack);
            }
        }

        if(toMute.roles.has(role.id)) return message.reply("This user is already muted!");

        await toMute.addRole(role);
        message.channel.sendMessage("User has been muted!");

        return;
    }

    //Unmute Command
    if(command === `${prefix}unmute`) {
        if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.reply("You don't have permission to use that command!");
        

        let toMute = message.guild.member(message.mentions.users.first())|| message.guild.members.get(args[0]); 
        if(!toMute) return message.reply("You did not specify a user!");

        let role = message.guild.roles.find(r => r.name === "Legit Mute");

        if(!role || !toMute.roles.has(role.id)) return message.reply("This user is not muted!");

        await toMute.removeRole(role);
        message.channel.sendMessage("User has been unmuted!");

        return;
    }

    //Legit Command
    if(command === `${prefix}legit`) {
        let embed = new Discord.RichEmbed()
            .setTitle("Cheats")
            .setColor("#ce0000")
            .setFooter("Legit my ass!")
            .addBlankField()
            .addField("GTA V", "Epsilon Cheats\n\nStatus: Online\nWebsite: https://epsiloncheats.net/\nDiscord: https://discord.gg/kBnecFZ", true)
            .addField("PUBG", "Zenium Private\n\nStatus: Online\nWebsite: https://www.zeniumcheats.com/\nDiscord: https://discord.gg/qfQRv7c\n", true);
         
        message.reply("Check your PM's!");    
        message.author.sendMessage(embed);

        return;
    }

    //Ping Command
    if(command === `${prefix}ping`) {
        const m = await message.channel.send("Ping?");
        m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms.`);
    }

    //Kick Command
    if(command === `${prefix}kick`) {
        if(!message.member.hasPermission("ADMINISTRATOR")) return message.reply("You don't have permission to use that command!");

        let member = message.mentions.members.first();
        if(!member)
            return message.reply("Please mention a valid member of this server");
        if(!member.kickable) 
            return message.reply("I cannot kick this user! Do they have a higher role? Do I have kick permissions?");

        let reason = args.slice(1).join(' ');
        if(!reason)
            return message.reply("Please indicate a reason for the kick!");

        await member.kick(reason)
            .catch(error => message.reply(`Sorry ${message.author} I couldn't kick because of : ${error}`));
        message.reply(`${member.user.tag} has been kicked by ${message.author.tag} because: ${reason}`);
    }

    //Ban Command
    if(command === `${prefix}ban`) {
        if(!message.member.hasPermission("ADMINISTRATOR")) return message.reply("You don't have permission to use that command!");

        let member = message.mentions.members.first();
        if(!member)
            return message.reply("Please mention a valid member of this server");
        if(!member.bannable) 
            return message.reply("I cannot ban this user! Do they have a higher role? Do I have ban permissions?");

        let reason = args.slice(1).join(' ');
        if(!reason)
            return message.reply("Please indicate a reason for the ban!");
    
        await member.ban(reason)
            .catch(error => message.reply(`Sorry ${message.author} I couldn't ban because of : ${error}`));
        message.reply(`${member.user.tag} has been banned by ${message.author.tag} because: ${reason}`);
    }

    //Purge command
    if(command === `${prefix}purge`) {
        if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.reply("You don't have permission to use that command!");
        const deleteCount = parseInt(args[0], 10);
    
        if(!deleteCount || deleteCount < 2 || deleteCount > 5000)
            return message.reply("Please provide a number between 2 and 1000 for the number of messages to delete");

        const fetched = await message.channel.fetchMessages({count: deleteCount});
        message.channel.bulkDelete(fetched)
            .catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
        message.reply("Deleted " + deleteCount + " messages!");
    }

    //Say Command
    if(command === `${prefix}say`) {
        if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.reply("You don't have permission to use that command!");
        const sayMessage = args.join(" ");
        message.delete().catch(O_o=>{});
        message.guild.channels.get('407015268997398529').send(sayMessage);
    }

    if(command === `${prefix}faen`) {
        message.channel.sendMessage(`https://www.tenor.co/Ihnf.gif`);
    }
});

bot.login(config.token);