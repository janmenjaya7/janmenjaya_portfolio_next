"use client";
import { createContext, useContext } from "react";
import { DATA, type PortfolioData } from "../data";

const PortfolioContext = createContext<PortfolioData>(DATA);

/* Supplies the Redis-backed portfolio content to all client components */
export function PortfolioProvider({
  data,
  children,
}: {
  data: PortfolioData;
  children: React.ReactNode;
}) {
  return <PortfolioContext.Provider value={data}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio(): PortfolioData {
  return useContext(PortfolioContext);
}
