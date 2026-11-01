import { useMemo, useState } from "react";
import type {
  ChatMessage,
  EmployeeRecord,
  EmployeeSession,
} from "../../mocks/employeePanel";
import { useBackendChat } from "../BackendChat";
import { ChatManagement } from "./ChatManagement";
import { useIntegrationCopy } from "../../integrationCopy";
import { Button, Select } from "../../components/ui/controls";
import { Field } from "./shared";

export function ConnectedEmployeeChat({
  employees,
  session,
}: {
  employees: EmployeeRecord[];
  session: EmployeeSession;
}) {
  const labels = useIntegrationCopy();
  const [senderId, setSenderId] = useState(0);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(0);
  const directory = employees.filter(
    (employee) => employee.active && employee.userId,
  );
  const recipient =
    directory.find(
      (employee) =>
        employee.id === selectedEmployeeId && employee.userId !== senderId,
    ) ?? directory.find((employee) => employee.userId !== senderId);
  const identity = useMemo(
    () =>
      senderId &&
      directory.some((employee) => employee.userId === senderId) &&
      recipient?.userId
        ? { senderId, receiverId: recipient.userId }
        : null,
    [
      senderId,
      recipient?.userId,
      directory.some((employee) => employee.userId === senderId),
    ],
  );
  const chat = useBackendChat(identity);
  const messages: ChatMessage[] = chat.messages.map((message) => ({
    id: message.id,
    senderId: message.senderId,
    receiverId: message.receiverId,
    author:
      employees.find((employee) => employee.userId === message.senderId)
        ?.name ?? String(message.senderId),
    recipient: recipient?.name,
    role: "empleado",
    roleName:
      employees.find((employee) => employee.userId === message.senderId)
        ?.roleName ?? "",
    text: message.message,
    time: new Date(message.sentAt).toLocaleString(),
  }));
  return (
    <ChatManagement
      employees={directory}
      session={session}
      messages={messages}
      selectedEmployeeId={recipient?.id ?? 0}
      onSelectEmployee={setSelectedEmployeeId}
      onSend={(event) => {
        event.preventDefault();
        chat.send();
      }}
      connection={{
        senderId,
        connected: chat.connected,
        loading: chat.loading,
        sending: chat.sending,
        error: chat.error,
        text: chat.text,
        setText: chat.setText,
        header: (
          <div className="mt-5 grid gap-4">
            <p className="text-sm text-zinc-300">{labels.chatIdentity}</p>
            <Field label={labels.senderId}>
              <Select
                disabled={chat.sending}
                value={senderId || ""}
                onChange={(event) => setSenderId(Number(event.target.value))}
              >
                <option value="" disabled>
                  —
                </option>
                {directory.map((employee) => (
                  <option key={employee.id} value={employee.userId}>
                    {employee.name} · {employee.userId}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex items-center gap-4">
              <p role="status">
                {chat.loading
                  ? labels.load
                  : chat.connected
                    ? labels.connected
                    : labels.disconnected}
              </p>
              <Button
                variant="secondary"
                disabled={!identity || chat.sending}
                onClick={chat.retry}
              >
                {labels.retry}
              </Button>
            </div>
            {!recipient && <p>{labels.empty}</p>}
          </div>
        ),
      }}
    />
  );
}
