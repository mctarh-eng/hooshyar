'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, MoreVertical, Pencil, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useConversationList,
  useDeleteConversation,
  useRenameConversation,
} from '@/hooks/use-conversations';
import { getProvider } from '@/lib/providers';
import { useUIStore } from '@/lib/store';
import type { ConversationSummary } from '@/lib/types';
import { cn, timeAgo } from '@/lib/utils';

function HistoryRow({
  conversation,
  onOpen,
  onRename,
  onDelete,
}: {
  conversation: ConversationSummary;
  onOpen: (id: string) => void;
  onRename: (c: ConversationSummary) => void;
  onDelete: (c: ConversationSummary) => void;
}) {
  const provider = getProvider(conversation.providerId);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(conversation.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(conversation.id);
        }
      }}
      className="flex cursor-pointer items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
    >
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-xl shadow-sm',
          provider.gradient
        )}
        aria-hidden
      >
        {provider.emoji}
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-semibold">{conversation.title}</p>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {conversation.lastMessage || 'هنوز پیامی رد و بدل نشده'}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <span className="text-[11px] text-muted-foreground">
          {timeAgo(conversation.updatedAt)}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-full"
              aria-label={`گزینه‌های گفتگوی ${conversation.title}`}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="size-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={() => onRename(conversation)}>
              <Pencil className="size-4" aria-hidden />
              تغییر نام
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(conversation)}>
              <Trash2 className="size-4" aria-hidden />
              حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ChevronLeft className="size-4 text-muted-foreground" aria-hidden />
      </div>
    </div>
  );
}

export function HistoryView() {
  const openConversation = useUIStore((s) => s.openConversation);
  const startNewChat = useUIStore((s) => s.startNewChat);

  const { data: conversations, isLoading, isError } = useConversationList();
  const renameMutation = useRenameConversation();
  const deleteMutation = useDeleteConversation();

  const [query, setQuery] = useState('');
  const [renameTarget, setRenameTarget] = useState<ConversationSummary | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ConversationSummary | null>(null);

  const filtered = useMemo(() => {
    const list = conversations ?? [];
    const q = query.trim();
    const base = q
      ? list.filter(
          (c) => c.title.includes(q) || (c.lastMessage ?? '').includes(q)
        )
      : list;
    return [...base].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [conversations, query]);

  const isEmpty = !isLoading && filtered.length === 0;
  const countLabel = filtered.length.toLocaleString('fa-IR');

  const handleRename = () => {
    if (!renameTarget) return;
    const title = renameValue.trim();
    if (!title) return;
    renameMutation.mutate(
      { id: renameTarget.id, title },
      {
        onSuccess: () => {
          toast.success('نام عوض شد ✅');
          setRenameTarget(null);
        },
        onError: () => toast.error('تغییر نام نشد! دوباره امتحان کن'),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('حذف شد 🗑️');
        setDeleteTarget(null);
      },
      onError: () => toast.error('حذف نشد! دوباره امتحان کن'),
    });
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pb-4 pt-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold">گفتگوهای اخیر</h1>
        <Badge variant="secondary" className="rounded-full">
          {countLabel} گفتگو
        </Badge>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute inset-y-0 start-3.5 my-auto size-4 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجو در گفتگوها..."
          aria-label="جستجوی گفتگوها"
          className="h-11 rounded-full ps-10"
        />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isEmpty && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed bg-card/60 p-10 text-center">
          <span className="text-6xl" aria-hidden>
            {query.trim() || isError ? '🔍' : '🗂️'}
          </span>
          <p className="font-bold">
            {isError
              ? 'ای وای، چیزی گم شد!'
              : query.trim()
                ? 'چیزی پیدا نشد'
                : 'هنوز گفتگویی نداری'}
          </p>
          <p className="text-sm text-muted-foreground">
            {isError
              ? 'نتونستیم گفتگوها رو بیاریم؛ اتصال اینترنت رو چک کن و صفحه رو رفرش کن.'
              : query.trim()
                ? 'یه عبارت دیگه امتحان کن یا جستجو رو پاک کن.'
                : 'اولین گفتگوت رو شروع کن و از همه دستیارها جواب بگیر!'}
          </p>
          {!query.trim() && (
            <Button
              onClick={startNewChat}
              className="mt-1 h-11 rounded-2xl px-6 font-bold"
            >
              شروع اولین گفتگو
            </Button>
          )}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((c) => (
            <HistoryRow
              key={c.id}
              conversation={c}
              onOpen={openConversation}
              onRename={(conv) => {
                setRenameTarget(conv);
                setRenameValue(conv.title);
              }}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* دیالوگ تغییر نام */}
      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
      >
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>تغییر نام گفتگو</DialogTitle>
            <DialogDescription>
              یه اسم جدید و باحال برای این گفتگو انتخاب کن!
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            aria-label="نام جدید گفتگو"
            className="h-11"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              بیخیال
            </Button>
            <Button
              onClick={handleRename}
              disabled={!renameValue.trim() || renameMutation.isPending}
            >
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ تأیید حذف */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>این گفتگو حذف بشه؟</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleteTarget?.title}» برای همیشه پاک می‌شه و دیگه نمی‌شه برگردوندش.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>نه، بیخیال</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
            >
              آره، حذف کن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
