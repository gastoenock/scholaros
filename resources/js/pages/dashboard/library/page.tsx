import { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { useCurrentSchool } from "../_components/use-current-school.ts";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { toast } from "sonner";
import { routerDeleteWithConfirm } from "@/lib/confirm.ts";
import { motion } from "motion/react";
import { Library, Plus, Search, BookOpen, ArrowLeftRight, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";

type Book = {
  id: number;
  schoolId: number;
  title: string;
  author: string;
  isbn?: string | null;
  category?: string | null;
  publisher?: string | null;
  publishYear?: string | null;
  totalCopies: number;
  availableCopies: number;
  shelfLocation?: string | null;
  coverUrl?: string | null;
  description?: string | null;
  createdAt: string;
};

type Issuance = {
  id: number;
  schoolId: number;
  bookId: number;
  borrowerId: string;
  borrowerType: "student" | "staff";
  borrowerName: string;
  issuedAt: string;
  dueDate: string;
  returnedAt?: string | null;
  status: string;
  createdAt: string;
};

type StudentOption = {
  id: number;
  firstName: string;
  lastName: string;
  studentId: string;
};

type StaffOption = {
  id: number;
  firstName: string;
  lastName: string;
  staffId: string;
};

type PageProps = {
  books: Book[];
  issuances: Issuance[];
  students: StudentOption[];
  staff: StaffOption[];
};

// ─── Book Catalog ─────────────────────────────────────────────
function BookCatalog({ books: allBooks, students, staff }: { books: Book[]; students: StudentOption[]; staff: StaffOption[] }) {
  const [open, setOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", author: "", isbn: "", category: "", publisher: "", publishYear: "", totalCopies: "1", shelfLocation: "", description: "" });
  const [issueForm, setIssueForm] = useState<{ borrowerId: string; borrowerType: "student" | "staff"; borrowerName: string; dueDate: string }>({ borrowerId: "", borrowerType: "student", borrowerName: "", dueDate: "" });

  const books = useMemo(() => {
    if (!search) return allBooks;
    const term = search.toLowerCase();
    return allBooks.filter(
      (b) =>
        b.title.toLowerCase().includes(term) ||
        b.author.toLowerCase().includes(term) ||
        b.isbn?.toLowerCase().includes(term) ||
        b.category?.toLowerCase().includes(term),
    );
  }, [allBooks, search]);

  const handleAdd = () => {
    router.post("/dashboard/library/books", {
      title: form.title,
      author: form.author,
      isbn: form.isbn || undefined,
      category: form.category || undefined,
      publisher: form.publisher || undefined,
      publishYear: form.publishYear || undefined,
      totalCopies: parseInt(form.totalCopies) || 1,
      shelfLocation: form.shelfLocation || undefined,
      description: form.description || undefined,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Book added to catalog");
        setOpen(false);
        setForm({ title: "", author: "", isbn: "", category: "", publisher: "", publishYear: "", totalCopies: "1", shelfLocation: "", description: "" });
      },
      onError: () => toast.error("Failed to add book"),
    });
  };

  const handleIssue = () => {
    if (!selectedBook) return;
    router.post("/dashboard/library/issuances", {
      bookId: selectedBook.id,
      borrowerId: issueForm.borrowerId,
      borrowerType: issueForm.borrowerType,
      borrowerName: issueForm.borrowerName,
      dueDate: issueForm.dueDate,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Book issued successfully");
        setIssueOpen(false);
        setIssueForm({ borrowerId: "", borrowerType: "student", borrowerName: "", dueDate: "" });
      },
      onError: (errors) => toast.error(Object.values(errors)[0] ?? "Failed to issue book"),
    });
  };

  const borrowerOptions = issueForm.borrowerType === "student"
    ? students.map((s) => ({ id: String(s.id), name: `${s.firstName} ${s.lastName} (${s.studentId})` }))
    : staff.map((s) => ({ id: String(s.id), name: `${s.firstName} ${s.lastName} (${s.staffId})` }));

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search books, authors, ISBN…" className="pl-9" />
        </div>
        <Button size="sm" onClick={() => setOpen(true)} className="cursor-pointer"><Plus className="h-4 w-4 mr-1.5" />Add Book</Button>
      </div>

      {books.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><Library className="h-10 w-10 mx-auto mb-3 opacity-40" />No books in catalog.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((b) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{b.title}</p>
                      <p className="text-xs text-muted-foreground">{b.author}</p>
                    </div>
                    <div className="flex gap-1.5 ml-2 shrink-0">
                      <button onClick={() => { setSelectedBook(b); setIssueOpen(true); }} className="p-1.5 rounded hover:bg-primary/10 text-primary cursor-pointer" title="Issue Book">
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => void routerDeleteWithConfirm(`/dashboard/library/books/${b.id}`, { title: "Delete this book?", onError: () => toast.error("Failed to remove book") })} className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 cursor-pointer" title="Delete Book"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {b.category && <Badge variant="secondary" className="text-xs">{b.category}</Badge>}
                    {b.isbn && <span className="text-xs text-muted-foreground">ISBN: {b.isbn}</span>}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{b.shelfLocation ?? "No shelf"}</span>
                    <span className={`font-semibold ${b.availableCopies === 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {b.availableCopies}/{b.totalCopies} available
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Book Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add Book to Catalog</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Book title" /></div>
              <div className="space-y-1.5"><Label>Author *</Label><Input value={form.author} onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))} placeholder="Author name" /></div>
              <div className="space-y-1.5"><Label>ISBN</Label><Input value={form.isbn} onChange={(e) => setForm((p) => ({ ...p, isbn: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. Science" /></div>
              <div className="space-y-1.5"><Label>Publisher</Label><Input value={form.publisher} onChange={(e) => setForm((p) => ({ ...p, publisher: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Year</Label><Input value={form.publishYear} onChange={(e) => setForm((p) => ({ ...p, publishYear: e.target.value }))} placeholder="2023" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Copies *</Label><Input type="number" min="1" value={form.totalCopies} onChange={(e) => setForm((p) => ({ ...p, totalCopies: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Shelf Location</Label><Input value={form.shelfLocation} onChange={(e) => setForm((p) => ({ ...p, shelfLocation: e.target.value }))} placeholder="e.g. A-12" /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="min-h-[60px]" /></div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.title || !form.author} className="cursor-pointer">Add Book</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Book Dialog */}
      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Issue Book: {selectedBook?.title}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between text-sm">
              <span>Available copies:</span>
              <span className={`font-bold ${(selectedBook?.availableCopies ?? 0) === 0 ? "text-red-600" : "text-emerald-600"}`}>{selectedBook?.availableCopies}</span>
            </div>
            <div className="space-y-1.5">
              <Label>Borrower Type</Label>
              <Select value={issueForm.borrowerType} onValueChange={(v) => setIssueForm((p) => ({ ...p, borrowerType: v as "student" | "staff", borrowerId: "", borrowerName: "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Select Borrower *</Label>
              <Select value={issueForm.borrowerId} onValueChange={(v) => {
                const person = borrowerOptions.find((p) => p.id === v);
                setIssueForm((prev) => ({ ...prev, borrowerId: v, borrowerName: person?.name ?? "" }));
              }}>
                <SelectTrigger><SelectValue placeholder="Select borrower…" /></SelectTrigger>
                <SelectContent>{borrowerOptions.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Due Date *</Label><Input type="date" value={issueForm.dueDate} onChange={(e) => setIssueForm((p) => ({ ...p, dueDate: e.target.value }))} min={format(new Date(), "yyyy-MM-dd")} /></div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIssueOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleIssue} disabled={!issueForm.borrowerId || !issueForm.dueDate || (selectedBook?.availableCopies ?? 0) === 0} className="cursor-pointer">
              <ArrowLeftRight className="h-4 w-4 mr-1.5" /> Issue Book
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Issuances / Returns ──────────────────────────────────────
function IssuancesTab({ issuances: allIssuances, books }: { issuances: Issuance[]; books: Book[] }) {
  const [filter, setFilter] = useState("all");

  const issuances = useMemo(
    () => (filter === "all" ? allIssuances : allIssuances.filter((i) => i.status === filter)),
    [allIssuances, filter],
  );

  const handleReturn = (id: number) => {
    router.post(`/dashboard/library/issuances/${id}/return`, {}, {
      preserveScroll: true,
      onSuccess: () => toast.success("Book returned"),
      onError: () => toast.error("Failed to return book"),
    });
  };

  const overdueCount = issuances.filter((i) => i.status === "issued" && differenceInDays(new Date(), new Date(i.dueDate)) > 0).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        {overdueCount > 0 && (
          <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
            <AlertCircle className="h-4 w-4" />
            {overdueCount} overdue issuance{overdueCount > 1 ? "s" : ""}
          </div>
        )}
        <div className="ml-auto flex gap-2">
          {["all", "issued", "returned", "overdue"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1.5 rounded-lg border capitalize cursor-pointer transition-colors ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"}`}>{f}</button>
          ))}
        </div>
      </div>

      {issuances.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No issuances found.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-semibold">Book</th>
                    <th className="text-left px-4 py-3 font-semibold">Borrower</th>
                    <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Issued</th>
                    <th className="text-left px-4 py-3 font-semibold">Due</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {issuances.map((i) => {
                    const book = books.find((b) => b.id === i.bookId);
                    const isOverdue = i.status === "issued" && differenceInDays(new Date(), new Date(i.dueDate)) > 0;
                    return (
                      <tr key={i.id} className="border-b last:border-0 hover:bg-muted/10">
                        <td className="px-4 py-3 font-medium">{book?.title ?? "Unknown"}</td>
                        <td className="px-4 py-3">
                          <span>{i.borrowerName}</span>
                          <span className="text-xs text-muted-foreground ml-1.5 capitalize">({i.borrowerType})</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{i.issuedAt.split("T")[0]}</td>
                        <td className={`px-4 py-3 font-medium ${isOverdue ? "text-red-600" : ""}`}>{i.dueDate}</td>
                        <td className="px-4 py-3">
                          <Badge className={`capitalize ${i.status === "returned" ? "bg-gray-100 text-gray-700" : isOverdue ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {isOverdue && i.status === "issued" ? "overdue" : i.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {i.status === "issued" && (
                            <Button size="sm" variant="secondary" onClick={() => handleReturn(i.id)} className="cursor-pointer">
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Return
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LibraryInner({ books, issuances, students, staff }: PageProps) {
  const { schoolId } = useCurrentSchool();

  if (!schoolId) return <div className="text-center py-20 text-muted-foreground">No school linked.</div>;

  const totalBooks = books.length;
  const totalCopies = books.reduce((acc, b) => acc + b.totalCopies, 0);
  const available = books.reduce((acc, b) => acc + b.availableCopies, 0);
  const activeIssuances = issuances.filter((i) => i.status === "issued").length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <Library className="h-6 w-6 text-primary" /> Digital Library
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Book catalog, issuance tracking, and returns management</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Titles", value: totalBooks, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Total Copies", value: totalCopies, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Available", value: available, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
          { label: "Issued Out", value: activeIssuances, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog" className="cursor-pointer"><BookOpen className="h-3.5 w-3.5 mr-1.5" />Catalog</TabsTrigger>
          <TabsTrigger value="issuances" className="cursor-pointer"><ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" />Issuances</TabsTrigger>
        </TabsList>
        <TabsContent value="catalog" className="mt-4"><BookCatalog books={books} students={students} staff={staff} /></TabsContent>
        <TabsContent value="issuances" className="mt-4"><IssuancesTab issuances={issuances} books={books} /></TabsContent>
      </Tabs>
    </div>
  );
}

export default function LibraryPage(props: PageProps) {
  return (
    <DashboardLayout>
      <LibraryInner {...props} />
    </DashboardLayout>
  );
}
