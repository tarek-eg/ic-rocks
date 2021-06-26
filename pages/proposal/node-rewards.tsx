import { DateTime } from "luxon";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BsInfoCircle } from "react-icons/bs";
import BalanceLabel from "../../components/Labels/BalanceLabel";
import { MetaTags } from "../../components/MetaTags";
import ProposalNav from "../../components/Proposals/ProposalNav";
import SimpleTable from "../../components/Tables/SimpleTable";
import { Table } from "../../components/Tables/Table";
import fetchJSON from "../../lib/fetch";
import { formatNumber } from "../../lib/numbers";
import { NodeProviderRewardsResponse } from "../../lib/types/API";

export default function NodeRewardsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [{ rows, count }, setResponse] = useState<NodeProviderRewardsResponse>({
    count: 0,
    rows: [],
  });

  const columns = useMemo(
    () => [
      {
        Header: "Principal",
        accessor: (d) => d.principal.id,
        disableSortBy: true,
        Cell: ({ value, row }) => (
          <Link href={`/principal/${value}`}>
            <a className="link-overflow">
              {row.original.principal.name || value}
            </a>
          </Link>
        ),
        className: "px-2 flex-1 flex oneline",
      },
      {
        Header: "Account",
        id: "accounts",
        accessor: (d) => d.account?.id,
        disableSortBy: true,
        Cell: ({ value, row }) =>
          value ? (
            <Link href={`/account/${value}`}>
              <a className="link-overflow">
                {row.original.account.name || value}
              </a>
            </Link>
          ) : (
            "-"
          ),
        className: "px-2 flex-1 flex oneline",
      },
      {
        Header: "Nodes",
        id: "providerOfCount",
        accessor: (d) => d.principal.providerOfCount,
        disableSortBy: true,
        Cell: ({ value }) => (value > 0 ? formatNumber(value) : "-"),
        className: "px-1 w-20 text-right",
      },
      {
        Header: "Amount",
        accessor: "amount",
        sortDescFirst: true,
        Cell: ({ value }) => <BalanceLabel value={value} />,
        className: "px-1 w-28 sm:w-36 text-right",
      },
      {
        Header: "Proposal",
        accessor: "proposalId",
        sortDescFirst: true,
        Cell: ({ value }) => (
          <Link href={`/proposal/${value}`}>
            <a className="link-overflow">{formatNumber(value)}</a>
          </Link>
        ),
        className: "px-1 w-16 xs:w-24 text-right",
      },
      {
        Header: "Date",
        accessor: (d) => d.proposal.decidedDate,
        disableSortBy: true,
        Cell: ({ value }) => DateTime.fromISO(value).toLocaleString(),
        className: "pr-2 w-24 text-right hidden sm:block",
      },
    ],
    []
  );

  const initialSort = useMemo(() => [{ id: "proposalId", desc: true }], []);

  const fetchData = useCallback(async ({ pageSize, pageIndex, sortBy }) => {
    setIsLoading(true);
    const res = await fetchJSON(
      "/api/node-rewards?" +
        new URLSearchParams({
          ...(sortBy.length > 0
            ? {
                orderBy: sortBy[0].id,
                order: sortBy[0].desc ? "desc" : "asc",
              }
            : {}),
          pageSize,
          page: pageIndex,
        })
    );
    if (res) setResponse(res);
    setIsLoading(false);
  }, []);

  const [stats, setStats] = useState(null);
  useEffect(() => {
    fetchJSON("/api/node-rewards/stats").then((data) => {
      if (data) {
        setStats(data);
      }
    });
  }, []);

  const summaryHeaders = [
    {
      contents: (
        <>
          Details
          <span
            aria-label="Node Providers are minted ICP as reward for participating in the
      network"
            data-balloon-pos="right"
            data-balloon-length="medium"
          >
            <BsInfoCircle className="ml-1 inline text-xs align-middle" />
          </span>
        </>
      ),
    },
  ];

  const summaryRows = useMemo(() => {
    return [
      [
        { contents: "Total Rewards Minted", className: "w-48" },
        {
          contents: stats ? <BalanceLabel value={stats.total_amount} /> : "-",
        },
      ],
      [
        { contents: "Principals", className: "w-48" },
        {
          contents: stats ? formatNumber(stats.principals) : "-",
        },
      ],
    ];
  }, [stats]);

  return (
    <div className="pb-16">
      <MetaTags
        title="Node Rewards"
        description={`A list of Node Rewards on the Internet Computer.`}
      />
      <ProposalNav />
      <h1 className="text-3xl my-8 overflow-hidden overflow-ellipsis">
        Node Provider Rewards
      </h1>
      <section className="mb-8">
        <SimpleTable headers={summaryHeaders} rows={summaryRows} />
      </section>
      <section>
        <Table
          name="node-rewards"
          className="text-xs sm:text-base"
          columns={columns}
          data={rows}
          count={count}
          fetchData={fetchData}
          loading={isLoading}
          initialSortBy={initialSort}
        />
      </section>
    </div>
  );
}