import {
  CodeExecutionRefusedError,
  RPCRequestError,
} from "../errors/index.js";

export const convertRPCError = (error: unknown): unknown => {
  if (!(error instanceof Error)) return error;

  let response;
  try {
    response = JSON.parse(error.message);
  }
  catch {
    return error;
  }
  if (typeof response?.code !== "number" || typeof response.message !== "string") return error;

  const data = typeof response.data === "string" ? response.data : undefined;
  const ErrorClass = data?.includes("rpc.allow_code_execution")
    ? CodeExecutionRefusedError
    : RPCRequestError;
  return new ErrorClass(error.message, response.code, response.message, data);
};
