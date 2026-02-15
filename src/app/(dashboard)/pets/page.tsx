"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  PawPrint,
  Heart,
  Pill,
  Scissors,
  Stethoscope,
  Plus,
  Check,
  Trash2,
  ChevronLeft,
  Clock,
  Dog,
  Cat,
  Bird,
  Fish,
  Rabbit,
  Activity,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

// ---------- Types ----------

interface PetCareLog {
  completedAt: string;
  member: { id: string; name: string };
}

interface PetCareTask {
  id: string;
  type: string;
  title: string;
  schedule: { intervalHours?: number } | null;
  dosage: string | null;
  logs: PetCareLog[];
  defaultMember: { id: string; name: string } | null;
}

interface PetHealthRecord {
  id: string;
  type: string;
  title: string;
  date: string;
  notes: string | null;
  fileUrl: string | null;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  photoUrl: string | null;
  birthday: string | null;
  weight: number | null;
  _count: { careTasks: number };
  latestCareLog?: PetCareLog | null;
}

interface PetDetail extends Pet {
  careTasks: PetCareTask[];
  healthRecords: PetHealthRecord[];
}

// ---------- Helpers ----------

const careTypeIcons: Record<string, typeof PawPrint> = {
  FEEDING: PawPrint,
  WALK: Activity,
  MEDICATION: Pill,
  GROOMING: Scissors,
  VET: Stethoscope,
};

const careTypeLabels: Record<string, string> = {
  FEEDING: "Feeding",
  WALK: "Walk",
  MEDICATION: "Medication",
  GROOMING: "Grooming",
  VET: "Vet",
};

const healthTypeLabels: Record<string, string> = {
  VACCINE: "Vaccine",
  VET_VISIT: "Vet Visit",
  MEDICATION: "Medication",
  OTHER: "Other",
};

const healthTypeBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  VACCINE: "default",
  VET_VISIT: "secondary",
  MEDICATION: "outline",
  OTHER: "secondary",
};

function SpeciesIcon({ species, className }: { species: string; className?: string }) {
  const s = species.toLowerCase();
  if (s.includes("dog")) return <Dog className={className} />;
  if (s.includes("cat")) return <Cat className={className} />;
  if (s.includes("bird") || s.includes("parrot")) return <Bird className={className} />;
  if (s.includes("fish")) return <Fish className={className} />;
  if (s.includes("rabbit") || s.includes("bunny")) return <Rabbit className={className} />;
  return <PawPrint className={className} />;
}

// ---------- Main Page ----------

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddPet, setShowAddPet] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddHealth, setShowAddHealth] = useState(false);

  const fetchPets = useCallback(async () => {
    const res = await fetch("/api/pets");
    if (res.ok) {
      const data = await res.json();
      setPets(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  async function fetchPetDetail(petId: string) {
    const res = await fetch(`/api/pets/${petId}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedPet(data);
    }
  }

  async function handleSelectPet(petId: string) {
    await fetchPetDetail(petId);
  }

  async function handleDeletePet(petId: string) {
    if (!confirm("Delete this pet and all its care data?")) return;
    const res = await fetch(`/api/pets/${petId}`, { method: "DELETE" });
    if (res.ok) {
      setSelectedPet(null);
      fetchPets();
    }
  }

  async function handleLogTask(taskId: string) {
    const res = await fetch(`/api/pets/tasks/${taskId}/log`, {
      method: "POST",
    });
    if (res.ok && selectedPet) {
      await fetchPetDetail(selectedPet.id);
    }
  }

  async function handleDeleteTask(petId: string, taskId: string) {
    const res = await fetch(`/api/pets/${petId}/tasks/${taskId}`, {
      method: "DELETE",
    });
    if (res.ok && selectedPet) {
      await fetchPetDetail(selectedPet.id);
    }
  }

  // ---------- Render: Pet Detail ----------

  if (selectedPet) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedPet(null);
              setShowAddTask(false);
              setShowAddHealth(false);
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {selectedPet.photoUrl ? (
              <img
                src={selectedPet.photoUrl}
                alt={selectedPet.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <SpeciesIcon species={selectedPet.species} className="h-6 w-6 text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate">{selectedPet.name}</h1>
              <p className="text-sm text-muted-foreground">
                {selectedPet.species}
                {selectedPet.breed && ` - ${selectedPet.breed}`}
                {selectedPet.weight && ` - ${selectedPet.weight} lbs`}
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeletePet(selectedPet.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Care Tasks Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PawPrint className="h-4 w-4" />
              Care Tasks
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddTask(!showAddTask)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {showAddTask && (
              <AddCareTaskForm
                petId={selectedPet.id}
                onCreated={() => {
                  setShowAddTask(false);
                  fetchPetDetail(selectedPet.id);
                }}
                onCancel={() => setShowAddTask(false)}
              />
            )}
            {selectedPet.careTasks.length === 0 && !showAddTask ? (
              <p className="text-sm text-muted-foreground py-2">
                No care tasks yet. Add one to start tracking.
              </p>
            ) : (
              selectedPet.careTasks.map((task) => {
                const Icon = careTypeIcons[task.type] || PawPrint;
                const lastLog = task.logs[0];
                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-secondary">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                          {careTypeLabels[task.type]}
                        </Badge>
                      </div>
                      {task.dosage && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Dosage: {task.dosage}
                        </p>
                      )}
                      {task.schedule && (task.schedule as { intervalHours?: number }).intervalHours && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          Every {(task.schedule as { intervalHours: number }).intervalHours}h
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {lastLog ? (
                          <>
                            Last: {formatDistanceToNow(new Date(lastLog.completedAt), { addSuffix: true })}
                            {" by "}
                            {lastLog.member.name}
                          </>
                        ) : (
                          "Never completed"
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Log completion"
                        onClick={() => handleLogTask(task.id)}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Delete task"
                        onClick={() => handleDeleteTask(selectedPet.id, task.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Health Records Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Health Records
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddHealth(!showAddHealth)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {showAddHealth && (
              <AddHealthRecordForm
                petId={selectedPet.id}
                onCreated={() => {
                  setShowAddHealth(false);
                  fetchPetDetail(selectedPet.id);
                }}
                onCancel={() => setShowAddHealth(false)}
              />
            )}
            {selectedPet.healthRecords.length === 0 && !showAddHealth ? (
              <p className="text-sm text-muted-foreground py-2">
                No health records yet.
              </p>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

                {selectedPet.healthRecords.map((record, idx) => (
                  <div key={record.id} className="relative flex gap-4 pb-4 last:pb-0">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-background border-2 border-border">
                      {record.type === "VACCINE" ? (
                        <Stethoscope className="h-3.5 w-3.5 text-primary" />
                      ) : record.type === "MEDICATION" ? (
                        <Pill className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Heart className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{record.title}</p>
                        <Badge variant={healthTypeBadgeVariant[record.type] || "secondary"} className="text-[10px]">
                          {healthTypeLabels[record.type]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(record.date), "MMM d, yyyy")}
                      </p>
                      {record.notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {record.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------- Render: Pet List ----------

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PawPrint className="h-6 w-6" />
            Pets
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your household pets and their care
          </p>
        </div>
        <Button onClick={() => setShowAddPet(!showAddPet)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Pet
        </Button>
      </div>

      {showAddPet && (
        <AddPetForm
          onCreated={() => {
            setShowAddPet(false);
            fetchPets();
          }}
          onCancel={() => setShowAddPet(false)}
        />
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      ) : pets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <PawPrint className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No pets added yet.</p>
            <p className="text-sm text-muted-foreground">
              Add your first pet to start tracking their care.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet) => (
            <Card
              key={pet.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => handleSelectPet(pet.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {pet.photoUrl ? (
                    <img
                      src={pet.photoUrl}
                      alt={pet.name}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <SpeciesIcon species={pet.species} className="h-7 w-7 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{pet.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {pet.species}
                      {pet.breed && ` - ${pet.breed}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {pet._count.careTasks} task{pet._count.careTasks !== 1 ? "s" : ""}
                      </Badge>
                      {pet.latestCareLog && (
                        <span className="text-[11px] text-muted-foreground">
                          Last care:{" "}
                          {formatDistanceToNow(new Date(pet.latestCareLog.completedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Add Pet Form ----------

function AddPetForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [birthday, setBirthday] = useState("");
  const [weight, setWeight] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !species.trim()) return;

    setSubmitting(true);
    const res = await fetch("/api/pets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        species: species.trim(),
        breed: breed.trim() || null,
        birthday: birthday || null,
        weight: weight || null,
      }),
    });

    if (res.ok) {
      onCreated();
    }
    setSubmitting(false);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Add New Pet</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              id="pet-name"
              label="Name *"
              placeholder="e.g. Buddy"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div className="space-y-1">
              <label htmlFor="pet-species" className="text-sm font-medium text-foreground">
                Species *
              </label>
              <select
                id="pet-species"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select species</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Fish">Fish</option>
                <option value="Rabbit">Rabbit</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              id="pet-breed"
              label="Breed"
              placeholder="e.g. Golden Retriever"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
            />
            <Input
              id="pet-birthday"
              label="Birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
            <Input
              id="pet-weight"
              label="Weight (lbs)"
              type="number"
              step="0.1"
              placeholder="e.g. 25.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting || !name.trim() || !species}>
              {submitting ? "Adding..." : "Add Pet"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------- Add Care Task Form ----------

function AddCareTaskForm({
  petId,
  onCreated,
  onCancel,
}: {
  petId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [intervalHours, setIntervalHours] = useState("");
  const [dosage, setDosage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!type || !title.trim()) return;

    setSubmitting(true);
    const res = await fetch(`/api/pets/${petId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        title: title.trim(),
        schedule: intervalHours ? { intervalHours: parseInt(intervalHours, 10) } : null,
        dosage: dosage.trim() || null,
      }),
    });

    if (res.ok) {
      onCreated();
    }
    setSubmitting(false);
  }

  return (
    <div className="rounded-lg border border-dashed border-border p-3 bg-secondary/30">
      <p className="text-sm font-medium mb-2">New Care Task</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="task-type" className="text-sm font-medium text-foreground">
              Type *
            </label>
            <select
              id="task-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select type</option>
              <option value="FEEDING">Feeding</option>
              <option value="WALK">Walk</option>
              <option value="MEDICATION">Medication</option>
              <option value="GROOMING">Grooming</option>
              <option value="VET">Vet</option>
            </select>
          </div>
          <Input
            id="task-title"
            label="Title *"
            placeholder="e.g. Morning feeding"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id="task-interval"
            label="Interval (hours)"
            type="number"
            min="1"
            placeholder="e.g. 12"
            value={intervalHours}
            onChange={(e) => setIntervalHours(e.target.value)}
          />
          {(type === "MEDICATION" || type === "") && (
            <Input
              id="task-dosage"
              label="Dosage"
              placeholder="e.g. 10mg twice daily"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
            />
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={submitting || !type || !title.trim()}>
            {submitting ? "Adding..." : "Add Task"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ---------- Add Health Record Form ----------

function AddHealthRecordForm({
  petId,
  onCreated,
  onCancel,
}: {
  petId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!type || !title.trim() || !date) return;

    setSubmitting(true);
    const res = await fetch(`/api/pets/${petId}/health`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        title: title.trim(),
        date,
        notes: notes.trim() || null,
      }),
    });

    if (res.ok) {
      onCreated();
    }
    setSubmitting(false);
  }

  return (
    <div className="rounded-lg border border-dashed border-border p-3 bg-secondary/30">
      <p className="text-sm font-medium mb-2">New Health Record</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="health-type" className="text-sm font-medium text-foreground">
              Type *
            </label>
            <select
              id="health-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select type</option>
              <option value="VACCINE">Vaccine</option>
              <option value="VET_VISIT">Vet Visit</option>
              <option value="MEDICATION">Medication</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <Input
            id="health-title"
            label="Title *"
            placeholder="e.g. Rabies vaccination"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id="health-date"
            label="Date *"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            id="health-notes"
            label="Notes"
            placeholder="Optional notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={submitting || !type || !title.trim() || !date}>
            {submitting ? "Adding..." : "Add Record"}
          </Button>
        </div>
      </form>
    </div>
  );
}
