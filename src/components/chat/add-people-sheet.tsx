"use client";

// Bottom sheet for adding people to an open bill check-in
import { useState } from "react";
import type { Member, BillCheckin } from "@/lib/types";

interface AddPeopleSheetProps {
  billId: string;
  groupMembers: Member[];
  checkedInMembers: BillCheckin[];
  onAdd: (memberId: string | null, guestName?: string) => Promise<void>;
  onClose: () => void;
}

export function AddPeopleSheet({
  groupMembers,
  checkedInMembers,
  onAdd,
  onClose,
}: AddPeopleSheetProps) {
  const [search, setSearch] = useState("");
  const [guestName, setGuestName] = useState("");
  const [showGuestInput, setShowGuestInput] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const checkedInMemberIds = new Set(
    checkedInMembers.map((c) => c.member_id).filter(Boolean)
  );

  const filteredMembers = groupMembers.filter((m) =>
    m.display_name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAddMember(memberId: string) {
    setAdding(memberId);
    await onAdd(memberId);
    setAdding(null);
  }

  async function handleAddGuest() {
    if (!guestName.trim()) return;
    setAdding("guest");
    await onAdd(null, guestName.trim());
    setGuestName("");
    setShowGuestInput(false);
    setAdding(null);
  }

  function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-xl animate-in slide-in-from-bottom duration-300">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          <h2 className="text-base font-bold text-gray-900">Thêm người</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm thành viên..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-300"
          />
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-4 pb-4">
          {/* Group members section */}
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Trong nhóm
          </p>

          {filteredMembers.length === 0 && (
            <p className="py-3 text-center text-sm text-gray-400">Không tìm thấy</p>
          )}

          {filteredMembers.map((m) => {
            const isCheckedIn = checkedInMemberIds.has(m.id);
            return (
              <div key={m.id} className="flex items-center gap-3 py-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                  {getInitials(m.display_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{m.display_name}</p>
                </div>
                {isCheckedIn ? (
                  <span className="text-xs font-medium text-green-600">
                    ✓ Đã check-in
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={adding === m.id}
                    onClick={() => handleAddMember(m.id)}
                    className="rounded-full bg-[#3A5CCC] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {adding === m.id ? "..." : "Thêm"}
                  </button>
                )}
              </div>
            );
          })}

          {/* Outside group section */}
          <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Người ngoài nhóm
          </p>

          {/* Guest entries already added */}
          {checkedInMembers
            .filter((c) => !c.member_id && c.guest_name)
            .map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                  {getInitials(c.guest_name!)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{c.guest_name}</p>
                  <p className="text-[10px] text-gray-400">Người ngoài</p>
                </div>
                <span className="text-xs font-medium text-green-600">✓ Đã check-in</span>
              </div>
            ))}

          {/* Add guest */}
          {showGuestInput ? (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddGuest()}
                placeholder="Tên người ngoài..."
                autoFocus
                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-300"
              />
              <button
                type="button"
                onClick={handleAddGuest}
                disabled={!guestName.trim() || adding === "guest"}
                className="rounded-xl bg-[#3A5CCC] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Thêm
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowGuestInput(true)}
              className="mt-1 flex w-full items-center gap-2 rounded-xl border border-dashed border-gray-300 px-3 py-2.5 text-sm text-gray-500 transition-colors active:bg-gray-50"
            >
              <span className="text-base">+</span>
              Thêm người lạ bằng tên
            </button>
          )}
        </div>
      </div>
    </>
  );
}
