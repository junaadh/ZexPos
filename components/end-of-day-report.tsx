import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Printer, Download, Calendar } from "lucide-react"
import type { UserType, Restaurant } from "@/lib/types"

interface EndOfDayReportProps {
    user: UserType
    restaurant: Restaurant | null
}

interface ReportData {
    date: string
    restaurant_id: string
    summary: {
        total_orders: number
        subtotal: number
        service_charge: number
        gst_amount: number
        grand_total: number
        average_order_value: number
    }
    orders: any[]
    category_breakdown: Record<string, { total: number, count: number }>
    item_breakdown: Record<string, { total: number, count: number }>
    payment_methods: {
        cash: number
        card: number
        digital: number
    }
    settings: {
        gst_rate: string
        service_charge_rate: string
    }
}

export function EndOfDayReport({ user, restaurant }: EndOfDayReportProps) {
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
    const [reportData, setReportData] = useState<ReportData | null>(null)
    const [loading, setLoading] = useState(false)

    const generateReport = async () => {
        if (!restaurant) {
            toast.error("Please select a restaurant first")
            return
        }

        setLoading(true)
        try {
            const response = await fetch(
                `/api/reports/end-of-day?restaurant_id=${restaurant.id}&date=${reportDate}`
            )

            if (!response.ok) {
                throw new Error('Failed to generate report')
            }

            const data = await response.json()
            setReportData(data)
            toast.success("Report generated successfully")
        } catch (error) {
            console.error('Error generating report:', error)
            toast.error("Failed to generate report")
        } finally {
            setLoading(false)
        }
    }

    const printReport = () => {
        window.print()
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD'
        }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-AU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">End of Day Report</h1>
                    <p className="text-muted-foreground">
                        Generate daily sales and performance reports
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Report Parameters</CardTitle>
                    <CardDescription>
                        Select the date and restaurant for the report
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="report-date">Report Date</Label>
                            <Input
                                id="report-date"
                                type="date"
                                value={reportDate}
                                onChange={(e) => setReportDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Restaurant</Label>
                            <div className="p-2 bg-muted rounded border">
                                {restaurant ? restaurant.name : "No restaurant selected"}
                            </div>
                        </div>
                    </div>
                    <Button onClick={generateReport} disabled={loading || !restaurant}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {loading ? "Generating..." : "Generate Report"}
                    </Button>
                </CardContent>
            </Card>

            {reportData && (
                <div className="space-y-6 print:space-y-4">
                    {/* Report Header */}
                    <Card className="print:shadow-none print:border-0">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl">{restaurant?.name}</CardTitle>
                            <CardDescription className="text-lg">
                                End of Day Report - {formatDate(reportData.date)}
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    {/* Summary */}
                    <Card className="print:shadow-none print:border-0">
                        <CardHeader>
                            <CardTitle>Daily Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <div className="text-2xl font-bold">{reportData.summary.total_orders}</div>
                                    <div className="text-sm text-muted-foreground">Total Orders</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{formatCurrency(reportData.summary.subtotal)}</div>
                                    <div className="text-sm text-muted-foreground">Subtotal</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{formatCurrency(reportData.summary.service_charge)}</div>
                                    <div className="text-sm text-muted-foreground">Service Charge ({reportData.settings.service_charge_rate}%)</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{formatCurrency(reportData.summary.gst_amount)}</div>
                                    <div className="text-sm text-muted-foreground">GST ({reportData.settings.gst_rate}%)</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-green-600">{formatCurrency(reportData.summary.grand_total)}</div>
                                    <div className="text-sm text-muted-foreground">Grand Total</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{formatCurrency(reportData.summary.average_order_value)}</div>
                                    <div className="text-sm text-muted-foreground">Average Order Value</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Category Breakdown */}
                    <Card className="print:shadow-none print:border-0">
                        <CardHeader>
                            <CardTitle>Sales by Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {Object.entries(reportData.category_breakdown).map(([category, data]) => (
                                    <div key={category} className="flex justify-between items-center">
                                        <span>{category}</span>
                                        <div className="text-right">
                                            <div className="font-medium">{formatCurrency(data.total)}</div>
                                            <div className="text-sm text-muted-foreground">{data.count} items</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Items */}
                    <Card className="print:shadow-none print:border-0">
                        <CardHeader>
                            <CardTitle>Top Selling Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {Object.entries(reportData.item_breakdown)
                                    .sort(([, a], [, b]) => b.total - a.total)
                                    .slice(0, 10)
                                    .map(([item, data]) => (
                                        <div key={item} className="flex justify-between items-center">
                                            <span>{item}</span>
                                            <div className="text-right">
                                                <div className="font-medium">{formatCurrency(data.total)}</div>
                                                <div className="text-sm text-muted-foreground">{data.count} sold</div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Methods */}
                    <Card className="print:shadow-none print:border-0">
                        <CardHeader>
                            <CardTitle>Payment Methods</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Cash</span>
                                    <span className="font-medium">{formatCurrency(reportData.payment_methods.cash)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Card</span>
                                    <span className="font-medium">{formatCurrency(reportData.payment_methods.card)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Digital Wallet</span>
                                    <span className="font-medium">{formatCurrency(reportData.payment_methods.digital)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex gap-2 print:hidden">
                        <Button onClick={printReport}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Report
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
