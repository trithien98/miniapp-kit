import { RESTDataSource } from "apollo-datasource-rest";

export class AccountsAPI extends RESTDataSource {
  baseURL = process.env.ACCOUNTS_BASE_URL ?? "https://example.org/mock/";

  async getMe() {
    return { id: "u1", name: "Jane Doe" };
  }
  async getAccount() {
    return { id: "a1", balance: 12543.77 };
  }
}
