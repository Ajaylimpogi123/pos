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
import useAddSupplier from "../Hooks/useAddCategory";

export default function AddModal({ children }) {
    const {
        open,
        openModal,
        closeModal,
        data,
        setData,
        errors,
        processing,
        handleSubmit,
    } = useAddSupplier();

    return (
        <>
            {/* Trigger */}
            <div onClick={openModal}>{children}</div>

            <Dialog open={open} onOpenChange={closeModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader className="pb-4">
                            <DialogTitle>Add Category</DialogTitle>
                            <DialogDescription />
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
                                    type="number"
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
                                <Label>Email</Label>
                                <Input
                                    value={data.email}
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                />
                                <InputError message={errors.email} />
                            </div>
                            <div className="grid gap-3">
                                <Label>Address</Label>
                                <Input
                                    value={data.address}
                                    onChange={(e) =>
                                        setData("address", e.target.value)
                                    }
                                />
                                <InputError message={errors.address} />
                            </div>
                        </div>

                        <DialogFooter className="mt-4">
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
                                Submit
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
