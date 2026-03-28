const { ServiceBroker } = require("moleculer");
const REPL = require("../../src");

const broker = new ServiceBroker({
	namespace: "e2e",
	// transporter: "TCP",
	nodeID: "main-node",
	logger: true
});

broker.createService({
	name: "greeter",
	actions: {
		welcome(ctx) {
			if (ctx.meta.greeting) {
				return `${ctx.meta.greeting} ${ctx.params.name || "Guest"}!`;
			}
			return `Hello ${ctx.params.name || "Guest"}!`;
		}
	},

	events: {
		"test.event"(ctx) {
			this.logger.info(
				`Event received: ${ctx.eventName}, type: ${ctx.eventType}, groups: ${ctx.eventGroups}, params: ${JSON.stringify(ctx.params)}, meta: ${JSON.stringify(ctx.meta)}`
			);
		}
	}
});

async function start() {
	await broker.start();
	REPL(broker, {});
}

start();
