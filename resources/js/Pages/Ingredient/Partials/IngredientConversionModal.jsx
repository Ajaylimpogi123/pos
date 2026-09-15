// Place at: resources/js/Pages/Ingredient/Partials/IngredientConversionModal.jsx
//
// Wrap any trigger element with this, passing the ingredient it applies to:
//
//   <IngredientConversionModal ingredient={ing}>
//     <Button size="sm" variant="outline">Conversions</Button>
//   </IngredientConversionModal>
//
// Wherever `ing` is loaded, make sure its `conversions` relation is
// eager-loaded on the backend (IngredientController::index does this),
// or this will just show an empty list.

import { useState } from "react";
import { router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogClose,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { toast } from "sonner";
import UnitSearchSelect from "@/Components/UnitSearchSelect";

export default function IngredientConversionModal({ ingredient, children }) {
    const [open, setOpen] = useState(false);
    const [fromUnit, setFromUnit] = useState("");
    const [factor, setFactor] = useState("");
    const [saving, setSaving] = useState(false);

    const conversions = ingredient.conversions ?? [];

    const handleAdd = (e) => {
        e.preventDefault();

        if (!fromUnit || !factor || Number(factor) <= 0) {
            toast.error("Choose a unit and enter a positive factor");
            return;
        }

        setSaving(true);
        router.post(
            route("ingredient-conversion.store", ingredient.ing_id),
            { from_unit: fromUnit, factor },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Conversion saved");
                    setFromUnit("");
                    setFactor("");
                },
                onError: (errs) => {
                    toast.error(
                        Object.values(errs)[0] || "Failed to save conversion",
                    );
                },
                onFinish: () => setSaving(false),
            },
        );
    };

    const handleRemove = (conv_id) => {
        router.delete(route("ingredient-conversion.destroy", conv_id), {
            preserveScroll: true,
            onSuccess: () => toast.success("Conversion removed"),
        });
    };

    return (
        <>
            <div onClick={() => setOpen(true)}>{children}</div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[440px] rounded-md">
                    <DialogHeader>
                        <DialogTitle>
                            Custom Conversions — {ingredient.ing_name}
                        </DialogTitle>
                    </DialogHeader>

                    <p className="text-xs text-muted-foreground -mt-2">
                        Only needed for units that can't be auto-converted (e.g.
                        cups → grams, which depends on density). Stock unit for
                        this ingredient is <strong>{ingredient.unit}</strong>.
                    </p>

                    {conversions.length > 0 && (
                        <div className="border rounded-md divide-y text-sm">
                            {conversions.map((c) => (
                                <div
                                    key={c.conv_id}
                                    className="flex items-center justify-between px-3 py-2"
                                >
                                    <span>
                                        1 {c.from_unit} = {c.factor}{" "}
                                        {ingredient.unit}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(c.conv_id)}
                                        className="text-destructive hover:text-destructive/80"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleAdd} className="grid gap-3 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label className="text-xs">From unit</Label>
                                <UnitSearchSelect
                                    value={fromUnit}
                                    onChange={setFromUnit}
                                    exclude={[ingredient.unit]}
                                    placeholder="Search unit..."
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label className="text-xs">
                                    = how many {ingredient.unit}?
                                </Label>
                                <Input
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    placeholder="e.g. 120"
                                    value={factor}
                                    onChange={(e) => setFactor(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button type="submit" size="sm" disabled={saving}>
                            {saving ? "Saving..." : "Add Conversion"}
                        </Button>
                    </form>

                    <DialogFooter className="mt-2">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Close
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
