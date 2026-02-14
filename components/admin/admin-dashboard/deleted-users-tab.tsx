import { Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { DeletedUser, TranslationFn } from "@/components/admin/admin-dashboard/types"

interface DeletedUsersTabProps {
    deletedUsers: DeletedUser[]
    t: TranslationFn
}

export function DeletedUsersTab({ deletedUsers, t }: DeletedUsersTabProps) {
    return (
        <Card>
            <CardHeader>
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-destructive" />
                        {t("admin.deletedUsers")}
                    </CardTitle>
                    <CardDescription>{t("admin.deletedUsersDesc")}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {deletedUsers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Trash2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>{t("admin.noDeletedUsers")}</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("admin.user")}</TableHead>
                                <TableHead>{t("admin.email")}</TableHead>
                                <TableHead>{t("admin.layout")}</TableHead>
                                <TableHead>{t("admin.registerDate")}</TableHead>
                                <TableHead>{t("admin.deletionDate")}</TableHead>
                                <TableHead>{t("admin.deletedBy")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deletedUsers.map((user) => (
                                <TableRow key={user.id} className="opacity-70">
                                    <TableCell className="font-medium">{user.full_name || "Isimsiz"}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{(user.plan || "Free").toUpperCase()}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.original_created_at ? new Date(user.original_created_at).toLocaleDateString("tr-TR") : "-"}
                                    </TableCell>
                                    <TableCell>{new Date(user.deleted_at).toLocaleDateString("tr-TR")}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.deleted_by === "admin" ? "destructive" : "secondary"}>
                                            {user.deleted_by === "admin" ? t("admin.admin") : t("admin.user")}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
