import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ListFooterPager, type ListFooterPagerProps } from "./ListFooterPager";

const baseProps = (overrides: Partial<ListFooterPagerProps> = {}): ListFooterPagerProps => ({
  page: 1,
  pageSize: 20,
  totalCount: 100,
  totalPages: 5,
  hasNextPage: true,
  hasPreviousPage: false,
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
  ...overrides,
});

describe("ListFooterPager", () => {
  it("hides the previous button on the first page", () => {
    render(<ListFooterPager {...baseProps({ page: 1, hasPreviousPage: false })} />);
    expect(screen.queryByRole("button", { name: /previous page/i })).toBeNull();
    expect(screen.getByRole("button", { name: /next page/i })).toBeInTheDocument();
  });

  it("hides the next button on the last page", () => {
    render(
      <ListFooterPager
        {...baseProps({ page: 5, hasPreviousPage: true, hasNextPage: false })}
      />,
    );
    expect(screen.queryByRole("button", { name: /next page/i })).toBeNull();
    expect(screen.getByRole("button", { name: /previous page/i })).toBeInTheDocument();
  });

  it("renders the correct range label for an interior page", () => {
    render(
      <ListFooterPager
        {...baseProps({ page: 3, pageSize: 20, totalCount: 100 })}
      />,
    );
    // page 3 of 20-per-page over 100 ⇒ 41–60 of 100
    expect(screen.getByText("41–60 of 100")).toBeInTheDocument();
  });

  it("clamps the range label end to the total count on the last page", () => {
    render(
      <ListFooterPager
        {...baseProps({ page: 5, pageSize: 20, totalCount: 92, hasNextPage: false, hasPreviousPage: true })}
      />,
    );
    expect(screen.getByText("81–92 of 92")).toBeInTheDocument();
  });

  it("shows a 0–0 range for an empty list", () => {
    render(
      <ListFooterPager
        {...baseProps({ page: 1, totalCount: 0, totalPages: 0, hasNextPage: false })}
      />,
    );
    expect(screen.getByText("0–0 of 0")).toBeInTheDocument();
  });

  it("emits onPageChange when a page number is clicked", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<ListFooterPager {...baseProps({ onPageChange })} />);
    await user.click(screen.getByRole("button", { name: /go to page 2/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("emits onPageSizeChange when a new page size is selected", async () => {
    const onPageSizeChange = vi.fn();
    const user = userEvent.setup();
    render(<ListFooterPager {...baseProps({ onPageSizeChange })} />);
    await user.click(screen.getByRole("combobox"));
    const listbox = await screen.findByRole("listbox");
    await user.click(within(listbox).getByText("50 / page"));
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it("disables the controls while fetching", () => {
    render(<ListFooterPager {...baseProps({ disabled: true })} />);
    expect(screen.getByRole("button", { name: /next page/i })).toBeDisabled();
  });
});
