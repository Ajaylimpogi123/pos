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

export default function EditModal({ customers, children }) {
    const {
        open,
        openModal,
        closeModal,
        data,
        setData,
        errors,
        processing,
        handleSubmit,
        handleFileChange,
    } = useEditCategory(customers);

    return (
        <>
            {/* Trigger */}
            <div onClick={openModal}>{children}</div>

            <Dialog open={open} onOpenChange={closeModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Edit Category</DialogTitle>
                            <DialogDescription>
                                Update category details
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4">
                            <div className="grid gap-3">
                                <Label>Customer Name</Label>
                                <Input
                                    value={data.cust_fname}
                                    onChange={(e) =>
                                        setData("cust_fname", e.target.value)
                                    }
                                />
                                <InputError message={errors.cust_fname} />
                            </div>

                            <div className="grid gap-3">
                                <Label>Customer Last Name</Label>
                                <Input
                                    value={data.cust_lname}
                                    onChange={(e) =>
                                        setData("cust_lname", e.target.value)
                                    }
                                />
                                <InputError message={errors.cust_lname} />
                            </div>

                            <div className="grid gap-3">
                                <Label>Customer Contact</Label>
                                <Input
                                    value={data.cust_contact}
                                    onChange={(e) =>
                                        setData("cust_contact", e.target.value)
                                    }
                                />
                                <InputError message={errors.cust_contact} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Customer Image</Label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />

                                {/* Existing image */}
                                {customers.cust_image && !data.cust_image && (
                                    <div className="mt-2">
                                        <p className="text-xs text-gray-500">
                                            Current image:
                                        </p>
                                        <img
                                            src={`/storage/${customers.cust_image}`}
                                            className="w-20 h-20 object-cover rounded"
                                        />
                                    </div>
                                )}

                                {/* New image selected */}
                                {data.cust_image instanceof File && (
                                    <p className="text-xs text-green-500">
                                        New image: {data.cust_image.name}
                                    </p>
                                )}

                                <InputError message={errors.cust_image} />
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
