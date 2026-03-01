import { Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { AdminUser, TranslationFn } from "@/components/admin/admin-dashboard/types"

interface UsersTabProps {
    users: AdminUser[]
    filteredUsers: AdminUser[]
    searchTerm: string
    onSearchChange: (value: string) => void
    onPlanUpdate: (userId: string, plan: "free" | "plus" | "pro") => void
    t: TranslationFn
}

export function UsersTab({ filteredUsers, searchTerm, onSearchChange, onPlanUpdate, t }: UsersTabProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{t("admin.userList")}</CardTitle>
                        <CardDescription>{t("admin.userListDesc")}</CardDescription>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("admin.searchPlaceholder")}
                            className="pl-8"
                            value={searchTerm}
                            onChange={(event) => onSearchChange(event.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("admin.user")}</TableHead>
                            <TableHead>{t("admin.email")}</TableHead>
                            <TableHead>{t("admin.registerDate")}</TableHead>
                            <TableHead>{t("admin.renewalDate")}</TableHead>
                            <TableHead>{t("admin.status")}</TableHead>
                            <TableHead>{t("admin.currentPlan")}</TableHead>
                            <TableHead className="text-right">{t("common.actions")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.full_name || "Isimsiz"}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{new Date(user.created_at).toLocaleDateString("tr-TR")}</TableCell>
                                <TableCell>
                                    {user.subscription_end ? (
                                        new Date(user.subscription_end).toLocaleDateString("tr-TR")
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={user.subscription_status === "active" ? "outline" : "destructive"}
                                        className={
                                            user.subscription_status === "active"
                                                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                                : ""
                                        }
                                    >
                                        {user.subscription_status === "active" ? t("common.active") : t("common.passive")}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={user.plan === "pro" ? "default" : user.plan === "plus" ? "secondary" : "outline"}
                                        className={user.plan === "pro" ? "bg-gradient-to-r from-violet-600 to-indigo-600 border-0" : ""}
                                    >
                                        {(user.plan || "Free").toUpperCase()}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Select
                                        value={user.plan || "free"}
                                        onValueChange={(value) => onPlanUpdate(user.id, value as "free" | "plus" | "pro")}
                                    >
                                        <SelectTrigger className="w-[100px] ml-auto h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="free">Free</SelectItem>
                                            <SelectItem value="plus">Plus</SelectItem>
                                            <SelectItem value="pro">Pro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredUsers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    {t("admin.noUsersFound")}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
