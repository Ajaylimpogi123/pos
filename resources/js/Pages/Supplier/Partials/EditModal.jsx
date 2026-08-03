import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogClose,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InputError from "@/Components/InputError";
import useEditCategory from "../Hooks/useEditCategory";

export default function EditModal({ supplier, children }) {
    const {
        open,
        openModal,
        closeModal,
        data,
        setData,
        errors,
        processing,
        handleSubmit,
    } = useEditCategory(supplier);

    return (
        <>
            {/* Trigger */}
            <div onClick={openModal}>{children}</div>

            <Dialog open={open} onOpenChange={closeModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Edit Supplier</DialogTitle>
                            <DialogDescription>
                                Update Supplier details
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4">
                            <div className="grid gap-3">
                                <Label>Supplier Name</Label>
                                <Input
                                    value={data.supplier_name}
                                    onChange={(e) =>
                                        setData("supplier_name", e.target.value)
                                    }
                                />
                                <InputError message={errors.supplier_name} />
                            </div>

                            <div className="grid gap-3">
                                <Label>Contact Person</Label>
                                <Input
                                    value={data.contact_person}
                                    onChange={(e) =>
                                        setData(
                                            "contact_person",
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError message={errors.contact_person} />
                            </div>

                            <div className="grid gap-3">
                                <Label>Contact Number</Label>
                                <Input
                                    value={data.contact_number}
                                    onChange={(e) =>
                                        setData(
                                            "contact_number",
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError message={errors.contact_number} />
                            </div>
                            <div className="grid gap-3">
                                <Label>Email </Label>
                                <Input
                                    value={data.email}
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-3">
                                <Label>Address </Label>
                                <Input
                                    value={data.address}
                                    onChange={(e) =>
                                        setData("address", e.target.value)
                                    }
                                />
                                <InputError message={errors.address} />
                            </div>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={processing}
                                    onClick={closeModal}
                                >
                                    Cancel
                                </Button>
                            </DialogClose>

                            <Button type="submit" disabled={processing}>
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
