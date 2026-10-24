import { ChatCryptoService } from './chat-crypto.service';

describe('ChatCryptoService', () => {
	let service: ChatCryptoService;
	let originalKey: string | undefined;

	beforeEach(() => {
		originalKey = process.env.CHAT_ENCRYPTION_KEY;
		process.env.CHAT_ENCRYPTION_KEY =
			'0123456789abcdef0123456789abcdef';

		service = new ChatCryptoService();
	});

	afterEach(() => {
		if (originalKey === undefined) {
			delete process.env.CHAT_ENCRYPTION_KEY;
		} else {
			process.env.CHAT_ENCRYPTION_KEY = originalKey;
		}
	});

	it.each([
		'Hello',
		'¡Hola! ¿Qué tal? 👋',
		'',
		'First line\nSecond line',
	])('encrypts and decrypts %j without data loss', (message) => {
		const encrypted = service.encrypt(message);

		expect(encrypted).not.toBe(message);
		expect(service.decrypt(encrypted)).toBe(message);
	});

	it('returns the expected IV, authentication tag and ciphertext format', () => {
		const encrypted = service.encrypt('Hello');

		expect(encrypted).toMatch(
			/^[0-9a-f]{32}:[0-9a-f]{32}:[0-9a-f]+$/,
		);
	});

	it('uses a different IV when encrypting the same message twice', () => {
		const first = service.encrypt('Hello');
		const second = service.encrypt('Hello');

		expect(first.split(':')[0]).not.toBe(second.split(':')[0]);
		expect(service.decrypt(first)).toBe('Hello');
		expect(service.decrypt(second)).toBe('Hello');
	});

	it.each([
		'invalid-payload',
		'first:second',
		'first:second:third:fourth',
	])('rejects an invalid payload format: %s', (payload) => {
		expect(() => service.decrypt(payload)).toThrow(
			'Invalid encrypted payload format',
		);
	});

	it('rejects modified ciphertext', () => {
		const [iv, tag, ciphertext] = splitPayload(service.encrypt('Hello'));
		const modifiedCiphertext =
			(ciphertext[0] === '0' ? '1' : '0') + ciphertext.slice(1);

		expect(() =>
			service.decrypt(`${iv}:${tag}:${modifiedCiphertext}`),
		).toThrow();
	});

	it('rejects a modified authentication tag', () => {
		const [iv, tag, ciphertext] = splitPayload(service.encrypt('Hello'));
		const modifiedTag = (tag[0] === '0' ? '1' : '0') + tag.slice(1);

		expect(() =>
			service.decrypt(`${iv}:${modifiedTag}:${ciphertext}`),
		).toThrow();
	});

	it('rejects a modified IV', () => {
		const [iv, tag, ciphertext] = splitPayload(service.encrypt('Hello'));
		const modifiedIv = (iv[0] === '0' ? '1' : '0') + iv.slice(1);

		expect(() =>
			service.decrypt(`${modifiedIv}:${tag}:${ciphertext}`),
		).toThrow();
	});

	it('cannot decrypt a message encrypted with a different key', () => {
		const encrypted = service.encrypt('Hello');

		process.env.CHAT_ENCRYPTION_KEY =
			'abcdef0123456789abcdef0123456789';

		const otherService = new ChatCryptoService();

		expect(() => otherService.decrypt(encrypted)).toThrow();
	});
	function splitPayload(payload: string): [string, string, string] {
		const parts = payload.split(':');
		const [iv, tag, ciphertext] = parts;

		if (
			parts.length !== 3 ||
			iv === undefined ||
			tag === undefined ||
			ciphertext === undefined
		) {
			throw new Error('Invalid test payload');
		}

		return [iv, tag, ciphertext];
	}
});
