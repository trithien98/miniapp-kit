import express from "express";
import cors from "cors";
import { readFile } from "node:fs/promises";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { AccountsAPI } from "./datasources/AccountsAPI.js";

const typeDefs = await readFile(
  new URL("./schema.graphql", import.meta.url),
  "utf8"
);

const resolvers = {
  Query: {
    me: async (_: any, __: any, { dataSources }: any) =>
      dataSources.accounts.getMe(),
    account: async (_: any, __: any, { dataSources }: any) =>
      dataSources.accounts.getAccount(),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
await server.start();

const app = express();
app.use(cors());

// Health endpoints (Shells can poll if desired)
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use(
  "/graphql",
  express.json(),
  expressMiddleware(server, {
    context: async () => ({
      dataSources: {
        accounts: new AccountsAPI(),
      },
    }),
  })
);

app.listen(8080, () => {
  // eslint-disable-next-line no-console
  console.log("BFF listening on 8080");
});
