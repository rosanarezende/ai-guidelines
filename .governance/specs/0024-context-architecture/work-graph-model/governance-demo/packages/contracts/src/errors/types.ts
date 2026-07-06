export type ContractErrorCode = string;

export type ContractError = {
  error: ContractErrorCode;
  detail?: string;
};
