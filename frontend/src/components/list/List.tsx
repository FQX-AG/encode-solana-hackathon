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
  thead > tr > th {
    background: #0b0d29;
    padding-top: 24px;
  }
  thead > tr:first-child > th:first-child {
    border-top-left-radius: 10px;
  }
  thead > tr:first-child > th:last-child {
    border-top-right-radius: 10px;
  }
  tbody > tr.selected > td {
    background-color: #15163a;
  }
`;

export type Column<Item = any> = {
  id: string;
  title?: string;
  style?: CSSProperties;
  component: React.ComponentType<Item>;
};

export type ListProps<Item extends object> = {
  data: Item[];
  itemKey: (item: Item) => string;
  columns: Column<Item>[];
  onItemClick?: (item: Item) => void;
  selectedKey?: string;
};

function List<Item extends object>(props: ListProps<Item>) {
  return (
    <TableContainer>
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

export default List;
