const { Serializer } = require('klasa');
const { Guild } = require('discord.js');

module.exports = class extends Serializer {

	serialize(data, piece, language) {
		if (data instanceof Guild) return data;
		const guild = this.constructor.regex.channel.test(data) ? this.client.guilds.get(data) : null;
		if (guild) return guild;
		throw language.get('RESOLVER_INVALID_CHANNEL', piece.key);
	}

	deserialize(value) {
		return value.id;
	}

	stringify(value) {
		return (value && value.name) || value;
	}

};
