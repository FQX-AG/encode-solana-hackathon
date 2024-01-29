import TableBase from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import * as React from "react";
import { createElement, CSSProperties } from "react";
import { Text } from "@/components/Text";
import { styled } from "@mui/material";

const Table = styled(TableBase)`
  border-spacing: 0;

  thead > tr > th {
    padding-block: 16px;
    color: ${({ theme }) => theme.customColors.oxfordBlue500};
  }
  tbody > tr.selected > td {
    background-color: #15163a;
  }
  tbody > tr > td {
    border-bottom: 1px solid #3f3f76;
    border-top: 16px solid transparent;
    background-clip: padding-box;
  }
  tbody > tr:last-of-type > td {
    border-bottom-width: 0;
  }
`;

export type Column<Item = any> = {
  id: string;
  title?: string;
  style?: CSSProperties;
  component: React.ComponentType<Item>;
};

type ListProps<Item extends object> = {
  data: Item[];
  itemKey: (item: Item) => string;
  columns: Column<Item>[];
  onItemClick?: (item: Item) => void;
  selectedKey?: string;
};

export function List<Item extends object>(props: ListProps<Item>) {
  return (
    <TableContainer sx={{ borderRadius: "10px", border: (theme) => `1px solid ${theme.customColors.oxfordBlue800}` }}>
      <Table>
        <TableHead>
          <TableRow>
            {props.columns.map((column) => (
              <TableCell key={column.id} style={column.style}>
                {column.title}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody className={props.onItemClick ? "clickable-rows" : undefined}>
          {props.data.map((item) => (
            <TableRow
              onClick={() => props.onItemClick?.(item)}
              key={props.itemKey(item)}
              className={props.itemKey(item) === props.selectedKey ? "selected" : undefined}
            >
              {props.columns.map((column) => (
                <TableCell key={column.id} style={column.style}>
                  {createElement(column.component, item)}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {props.data.length === 0 && (
            <TableRow>
              <TableCell colSpan={props.columns.length} sx={{ p: 4, textAlign: "center" }}>
                <Text variant="400|14px|18px">There is no data to display</Text>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
