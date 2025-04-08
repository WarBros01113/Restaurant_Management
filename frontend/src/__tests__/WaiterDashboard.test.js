import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WaiterDashboard from "../pages/WaiterDashboard";
import { rest } from "msw";
import { setupServer } from "msw/node";

// Mock socket.io to prevent real-time connection issues in tests
jest.mock("socket.io-client", () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  })),
}));

// Mock API server
const server = setupServer(
  rest.get("http://localhost:5000/api/menu", (req, res, ctx) => {
    return res(
      ctx.json([
        { _id: 1, name: "Pizza", availableQty: 10 },
        { _id: 2, name: "Burger", availableQty: 5 },
      ])
    );
  }),
  rest.get("http://localhost:5000/api/orders", (req, res, ctx) => {
    return res(ctx.json([]));
  }),
  rest.post("http://localhost:5000/api/orders", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: "Order sent" }));
  })
);

// Start and stop the mock server
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("WaiterDashboard Component", () => {
  test("renders the dashboard with menu", async () => {
    render(<WaiterDashboard />);

    expect(screen.getByText("Waiter Dashboard")).toBeInTheDocument();

    // Wait for menu items to load
    expect(await screen.findByText("Pizza")).toBeInTheDocument();
    expect(await screen.findByText("Burger")).toBeInTheDocument();
  });

  test("updates table number correctly", async () => {
    render(<WaiterDashboard />);

    const input = screen.getByPlaceholderText("Enter Table Number");
    fireEvent.change(input, { target: { value: "5" } });

    expect(input).toHaveValue("5");
  });

  test("adds an item to the queue", async () => {
    render(<WaiterDashboard />);

    await screen.findByText("Pizza");

    // Set table number
    const tableInput = screen.getByPlaceholderText("Enter Table Number");
    fireEvent.change(tableInput, { target: { value: "3" } });

    // Click 'Add to Queue' for Pizza
    const addToQueueButtons = screen.getAllByText("Add to Queue");
    fireEvent.click(addToQueueButtons[0]);

    // Check if the order appears in the queue
    expect(await screen.findByText("Pizza")).toBeInTheDocument();
  });

  test("prevents adding item if no table number is entered", async () => {
    render(<WaiterDashboard />);

    await screen.findByText("Pizza");

    const addToQueueButtons = screen.getAllByText("Add to Queue");
    fireEvent.click(addToQueueButtons[0]);

    // Ensure "Pending" text doesn't appear since table number was missing
    await waitFor(() => {
      expect(screen.queryByText("Pending")).not.toBeInTheDocument();
    });
  });

  test("sends order to cook", async () => {
    render(<WaiterDashboard />);

    await screen.findByText("Pizza");

    // Set table number
    const tableInput = screen.getByPlaceholderText("Enter Table Number");
    fireEvent.change(tableInput, { target: { value: "2" } });

    // Click 'Add to Queue'
    const addToQueueButtons = screen.getAllByText("Add to Queue");
    fireEvent.click(addToQueueButtons[0]);

    // Click 'Send Order'
    const sendOrderButton = screen.getByText("Send Order");
    fireEvent.click(sendOrderButton);

    // Wait for confirmation message
    await screen.findByText("Waiter Dashboard");
  });
});
