"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar, Download, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface DayData {
  date: string
  totalSales: number
  totalProfit: number
  transactionCount: number
}

interface SalesCalendarProps {
  warehouseId: string
  onDateClick: (date: string) => void
  apiEndpoint: string // '/api/sale/daily-analytics' for offline, '/api/sale/daily-analytics-online' for online
  className?: string
}

export function SalesCalendar({ warehouseId, onDateClick, apiEndpoint, className }: SalesCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [monthlyData, setMonthlyData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const today = new Date()
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  const startDate = new Date(monthStart)
  startDate.setDate(startDate.getDate() - monthStart.getDay())

  const fetchMonthlyData = async () => {
    setLoading(true)
    try {
      const monthStr = currentMonth.toISOString().slice(0, 7)
      const response = await fetch(`${apiEndpoint}?warehouseId=${warehouseId}&month=${monthStr}`)
      const data = await response.json()
      setMonthlyData(data)
    } catch (error) {
      console.error('Error fetching monthly data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (warehouseId) {
      fetchMonthlyData()
    }
  }, [currentMonth, warehouseId, apiEndpoint])

  const getDayData = (date: Date): DayData | null => {
    const dateStr = date.toISOString().split('T')[0]
    return monthlyData?.dailyStats?.find((day: any) => day.date === dateStr) || null
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const getDayClass = (date: Date, dayData: DayData | null) => {
    const isToday = date.toDateString() === today.toDateString()
    const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
    const hasSales = dayData && dayData.totalSales > 0

    return cn(
      "min-h-[80px] p-1 border border-gray-200 cursor-pointer transition-all duration-200 hover:bg-gray-50",
      {
        "bg-blue-50 border-blue-200": isToday,
        "text-gray-400": !isCurrentMonth,
        "bg-green-50 hover:bg-green-100": hasSales && isCurrentMonth,
        "hover:bg-blue-100": isToday
      }
    )
  }

  const renderCalendarDays = () => {
    const days = []
    const date = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      const dayData = getDayData(date)
      const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
      
      days.push(
        <div
          key={date.toISOString()}
          className={getDayClass(date, dayData)}
          onClick={() => isCurrentMonth && onDateClick(date.toISOString().split('T')[0])}
        >
          <div className="font-medium text-sm mb-1">
            {date.getDate()}
          </div>
          {dayData && isCurrentMonth && (
            <div className="space-y-1">
              <div className="text-xs text-green-600 font-medium">
                {formatCurrency(dayData.totalSales)}
              </div>
              <div className="text-xs text-blue-600">
                P: {formatCurrency(dayData.totalProfit)}
              </div>
              <div className="text-xs text-gray-500">
                {dayData.transactionCount} sales
              </div>
            </div>
          )}
        </div>
      )
      date.setDate(date.getDate() + 1)
    }

    return days
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Sales Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[120px] text-center">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              disabled={loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {monthlyData && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                <DollarSign className="h-4 w-4" />
                Total Sales
              </div>
              <div className="font-bold text-lg text-green-600">
                {formatCurrency(monthlyData.monthlyTotal.totalSales)}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                <TrendingUp className="h-4 w-4" />
                Total Profit
              </div>
              <div className="font-bold text-lg text-blue-600">
                {formatCurrency(monthlyData.monthlyTotal.totalProfit)}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                <ShoppingCart className="h-4 w-4" />
                Transactions
              </div>
              <div className="font-bold text-lg text-purple-600">
                {monthlyData.monthlyTotal.totalTransactions}
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-7 gap-0 mb-2">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 border-b">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-0 border">
          {loading ? (
            <div className="col-span-7 text-center py-8 text-gray-500">
              Loading calendar data...
            </div>
          ) : (
            renderCalendarDays()
          )}
        </div>
        
        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <div>• Click on any date to view detailed sales information</div>
          <div>• Green background indicates days with sales</div>
          <div>• Values shown: Total Sales, Profit (P:), Transaction count</div>
        </div>
      </CardContent>
    </Card>
  )
}