const { Monitor, Stopwatch, util: { regExpEsc } } = require('klasa');

module.exports = class extends Monitor {

	constructor(...args) {
		super(...args, { ignoreOthers: false });
		this.noPrefix = { length: 0, regex: null };
		this.prefixes = new Map();
		this.prefixMention = null;
		this.prefixMentionLength = null;
		this.nick = new RegExp('^<@!');
		this.prefixFlags = this.client.options.prefixCaseInsensitive ? 'i' : '';
	}

	async run(message) {
		if (message.guild && !message.guild.me) await message.guild.members.fetch(this.client.user);
		if (!message.channel.postable) return;
		if (message.content === this.client.user.toString() || (message.guild && message.content === message.guild.me.toString())) {
			await message.sendLocale('PREFIX_REMINDER', [message.guildSettings.prefix || undefined]);
			return;
		}

		const { command, prefix, prefixLength } = this.parseCommand(message);
		if (!command) return;

		const validCommand = this.client.commands.get(command);
		if (!validCommand) {
			if (this.client.listenerCount('commandUnknown')) this.client.emit('commandUnknown', message, command);
			return;
		}

		const timer = new Stopwatch();
		if (this.client.options.typing) message.channel.startTyping();
		message._registerCommand({ command: validCommand, prefix, prefixLength });

		try {
			await this.client.inhibitors.run(message, validCommand);
		} catch (response) {
			if (this.client.options.typing) message.channel.stopTyping();
			this.client.emit('commandInhibited', message, validCommand, response);
			return;
		}

		this.runCommand(message, timer);
	}

	parseCommand(message) {
		const result = this.getPrefix(message);
		if (!result) return { command: false };
		const { regex: prefix, length: prefixLength } = result;
		return {
			command: message.content.slice(prefixLength).trim().split(' ')[0].toLowerCase(),
			prefix,
			prefixLength
		};
	}

	getPrefix(message) {
		if (this.prefixMention.test(message.content)) return { length: this.nick.test(message.content) ? this.prefixMentionLength + 1 : this.prefixMentionLength, regex: this.prefixMention };
		if (!message.guildSettings.disableNaturalPrefix && this.client.options.regexPrefix) {
			const results = this.client.options.regexPrefix.exec(message.content);
			if (results) return { length: results[0].length, regex: this.client.options.regexPrefix };
		}
		const { prefix } = message.guildSettings;

		if (prefix) {
			for (const prf of Array.isArray(prefix) ? prefix : [prefix]) {
				const testingPrefix = this.prefixes.get(prf) || this.generateNewPrefix(prf);
				if (testingPrefix.regex.test(message.content)) return testingPrefix;
			}
		}

		return this.client.options.noPrefixDM && message.channel.type === 'dm' ? this.noPrefix : false;
	}

	generateNewPrefix(prefix) {
		const prefixObject = { length: prefix.length, regex: new RegExp(`^${regExpEsc(prefix)}`, this.prefixFlags) };
		this.prefixes.set(prefix, prefixObject);
		return prefixObject;
	}

	async runCommand(message, timer) {
		try {
			await message.prompter.run();
		} catch (error) {
			if (this.client.options.typing) message.channel.stopTyping();
			return this.client.emit('commandError', message, message.command, message.params, error);
		}

		const subcommand = message.command.subcommands ? message.params.shift() : undefined;
		const commandRun = subcommand ? message.command[subcommand](message, message.params) : message.command.run(message, message.params);

		if (this.client.options.typing) message.channel.stopTyping();
		timer.stop();

		try {
			const response = await commandRun;
			await this.client.finalizers.run(message, response, timer);
			return this.client.emit('commandSuccess', message, message.command, message.params, response);
		} catch (error) {
			return this.client.emit('commandError', message, message.command, message.params, error);
		}
	}

	init() {
		this.ignoreEdits = !this.client.options.commandEditing;
		this.prefixMention = new RegExp(`^<@!?${this.client.user.id}>`);
		this.prefixMentionLength = this.client.user.id.length + 3;
	}

};
