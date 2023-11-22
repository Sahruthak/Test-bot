//token:MTE2OTUwMjg4MDI4MjE5ODEwNg.GZOeTb.S09iPtnbMsNEsRORKrrzenbEcMUkcak0O5Lv2g
//id: 1169502880282198106
//invite link: https://discord.com/oauth2/authorize?client_id=1169502880282198106&scope=bot&permissions=1

const { Client, Intents } = require("discord.js");
const fetch = require("node-fetch");
const { token } = require("./config.json");
const userId = "1163725614512087040";
const intents = new Intents(32767);
const client = new Client({ intents });

const errorSentMap = new Map();
const acknowledgedErrors = new Set();
const errorData = new Map();

const { checkApiErrors } = require("./apiErrorChecker.js");

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  checkErrors();
});

async function checkErrors() {
  const checkAndSendErrors = async () => {
    const errors = await checkApiErrors();

    if (errors.length > 0) {
      if (!acknowledgedErrors.has(userId)) {
        const user = await client.users.fetch(userId);
        if (user) {
          if (!errorSentMap.has(userId)) {
            const errorMessage = await user
              .send("Errors detected:\n" + errors.join("\n"))
              .catch(console.error);
            errorSentMap.set(userId, true);

            setTimeout(async () => {
              // After waiting for 5 minutes, check if the user still hasn't acknowledged
              if (!acknowledgedErrors.has(userId)) {
                const message = await user.send(
                  "The Errors were not acknowledged within 5 minutes:\n" +
                    errors.join("\n")
                );
                errorData.set(message.id, { resolved: false });
                setTimeout(() => resendUnacknowledgedErrors(message.id), 30000);
              }
            }, 30000);
          }
        } else {
          console.error("User not found");
        }
      }
    }
  };

  checkAndSendErrors();
  setInterval(checkAndSendErrors, 10000);
}

async function resendUnacknowledgedErrors(messageId) {
  const errorInfo = errorData.get(messageId);

  if (errorInfo && !errorInfo.resolved) {
    const user = await client.users.fetch(userId);
    const errors = await checkApiErrors();

    if (errors.length > 0) {
      const message = await user.send(
        "The Errors were not acknowledged within 5 minutes:\n" +
          errors.join("\n")
      );
      errorData.set(message.id, { resolved: false });
      setTimeout(() => resendUnacknowledgedErrors(message.id), 30000);
    } else {
      errorInfo.resolved = true;
    }
  }
}

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.id === userId) {
    const message = reaction.message;
    const errorInfo = errorData.get(message.id);

    if (errorInfo) {
      if (reaction.emoji.name === "👍") {
        // Reset the error tracking state
        acknowledgedErrors.delete(userId);
        errorSentMap.delete(userId);
        errorData.delete(message.id);

        // Restart the error checking from the beginning
        checkErrors();
      } else if (reaction.emoji.name === "✅") {
        if (errorInfo.resolved === false) {
          errorInfo.resolved = true;
        }
      }
    }
  }
});

client.login(token);
