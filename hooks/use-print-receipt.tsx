"use client"

import { formatCurrency } from "@/lib/utils"
import { useCallback,useEffect,useRef } from "react"
import fetchWareHouseData from "./fetch-invidual-data"
import { getWareHouseId } from "./get-werehouseId"
import axios from "axios"


interface ReceiptItem {
  name: string
  quantity: number
  price: number
  total: number
}

interface PaymentMethod {
  id: string
  method: string
  amount: number
  reference?: string
  notes?: string
}

interface ReceiptData {
  invoiceNo: string
  date: string
  time: string
  customer: string
  cashier: string
  items: ReceiptItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethods?: PaymentMethod[]
  totalPaid?: number
  balance?: number
  paid?: number
  paymentMethod?: string
}

interface ReceiptSettings {
  companyName: string
  businessName: string
  address: string
  city: string
  state: string
  country: string
  phone: string
  email: string
  website: string
  receiptTitle?: string
  headerMessage?: string
  footerMessage?: string
  showLogo?: boolean
  logoUrl?: string
  showQrCode?: boolean
  qrCodeContent?: string
  customQrContent?: string
  showCustomerInfo?: boolean
  showCashierInfo?: boolean
  showItemCodes?: boolean
  showItemDescriptions?: boolean
  showTaxBreakdown?: boolean
  showPaymentMethods?: boolean
  showBalance?: boolean
  showTimestamp?: boolean
  use24HourFormat?: boolean
  showItemNumbers?: boolean
  showRunningTotal?: boolean
  paperSize?: string
  fontSize?: string
  printDensity?: string
  lineSpacing?: string
  primaryColor?: string
  accentColor?: string
  fontFamily?: string
  printCopyCount?: number
  autoPrint?: boolean
  language?: string
  currency?: string
  currencySymbol?: string
  currencyPosition?: string
}

export function usePrintReceipt() {
  const warehousesId = getWareHouseId()

  const printReceipt = useCallback(async (data: ReceiptData, paperWidth?: "57mm" | "80mm" | "A4") => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    try {
      // Fetch receipt settings from the database
      let settings: ReceiptSettings = {
        companyName: "YOUR COMPANY NAME",
        businessName: "",
        address: "123 Business Street",
        city: "City",
        state: "State",
        country: "Country",
        phone: "(555) 123-4567",
        email: "",
        website: "",
        receiptTitle: "SALES INVOICE",
        headerMessage: "",
        footerMessage: "Thank you for your business!",
        showLogo: false,
        logoUrl: "",
        showQrCode: false,
        qrCodeContent: "website",
        customQrContent: "",
        showCustomerInfo: true,
        showCashierInfo: true,
        showItemCodes: true,
        showItemDescriptions: true,
        showTaxBreakdown: true,
        showPaymentMethods: true,
        showBalance: true,
        showTimestamp: true,
        use24HourFormat: false,
        showItemNumbers: true,
        showRunningTotal: false,
        paperSize: "80mm",
        fontSize: "normal",
        printDensity: "normal",
        lineSpacing: "normal",
        primaryColor: "#000000",
        accentColor: "#666666",
        fontFamily: "monospace",
        printCopyCount: 1,
        autoPrint: false,
        language: "en",
        currency: "NGN",
        currencySymbol: `${formatCurrency(0)[0]}`,
        currencyPosition: "before"
      }

      if (warehousesId) {
        try {
          const response = await axios.get(`/api/receipt?warehousesId=${warehousesId}`)
          if (response.data) {
            settings = { ...settings, ...response.data }
          }
        } catch (error) {
          console.error("Error fetching receipt settings:", error)
          // Use default settings if fetch fails
        }
      }

      // Use paper size from settings or fallback to parameter
      const effectivePaperWidth = paperWidth || settings.paperSize || "80mm"
      const width = effectivePaperWidth === "57mm" ? "57mm" : effectivePaperWidth === "A4" ? "210mm" : "80mm"
      
      // Font size based on settings
      let fontSize = "12px"
      let lineHeight = "14px"
      if (settings.fontSize === "small") {
        fontSize = effectivePaperWidth === "57mm" ? "9px" : effectivePaperWidth === "A4" ? "12px" : "10px"
        lineHeight = effectivePaperWidth === "57mm" ? "11px" : effectivePaperWidth === "A4" ? "14px" : "12px"
      } else if (settings.fontSize === "large") {
        fontSize = effectivePaperWidth === "57mm" ? "11px" : effectivePaperWidth === "A4" ? "18px" : "14px"
        lineHeight = effectivePaperWidth === "57mm" ? "13px" : effectivePaperWidth === "A4" ? "22px" : "16px"
      } else {
        fontSize = effectivePaperWidth === "57mm" ? "10px" : effectivePaperWidth === "A4" ? "14px" : "12px"
        lineHeight = effectivePaperWidth === "57mm" ? "12px" : effectivePaperWidth === "A4" ? "18px" : "14px"
      }

      // Line spacing adjustments
      let spacingMultiplier = 1
      if (settings.lineSpacing === "compact") {
        spacingMultiplier = 0.8
      } else if (settings.lineSpacing === "wide") {
        spacingMultiplier = 1.2
      }

      const adjustedLineHeight = `${parseFloat(lineHeight) * spacingMultiplier}px`

      // Font family
      let fontFamily = "'Courier New', monospace"
      if (settings.fontFamily === "sans-serif") {
        fontFamily = "Arial, sans-serif"
      } else if (settings.fontFamily === "serif") {
        fontFamily = "Times, serif"
      }

      // Format currency based on settings
      const formatAmount = (amount: number) => {
        
        return formatCurrency(amount)
      }

      const formatPaymentMethods = () => {
        if (!settings.showPaymentMethods) return ""
        
        if (data.paymentMethods && data.paymentMethods.length > 0) {
          return data.paymentMethods
            .map(
              (pm) => `
            <div style="display: flex; justify-content: space-between; margin: 2px 0;">
              <span>${pm.method.charAt(0).toUpperCase() + pm.method.slice(1).replace("_", " ")}:</span>
              <span>${formatAmount(pm.amount)}</span>
            </div>
            ${pm.reference ? `<div style="font-size: 9px; color: #666; margin-left: 10px;">Ref: ${pm.reference}</div>` : ""}
          `,
            )
            .join("")
        }
        return `
          <div style="display: flex; justify-content: space-between;">
            <span>${data.paymentMethod || "Cash"}:</span>
            <span>${formatAmount(data.paid || data.totalPaid || 0)}</span>
          </div>
        `
      }

      const generateQRCodeContent = () => {
        if (!settings.showQrCode) return "first"
        
        let qrContent = ""
        switch (settings.qrCodeContent) {
          case "website":
            qrContent = settings.website || ""
            break
          case "contact":
            qrContent = `${settings.companyName}\n${settings.phone}\n${settings.email}`
            break
          case "custom":
            qrContent = settings.customQrContent || ""
            break
          default:
            qrContent = settings.website || ""
        }

        

        if (qrContent) {
          return "QR"
        }
        return "last"
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt - ${data.invoiceNo}</title>
            <style>
              @page {
                size: ${width} auto;
                margin: 0;
              }
              body {
                font-family: ${fontFamily};
                font-size: ${fontSize};
                line-height: ${adjustedLineHeight};
                margin: auto;
                padding: 8px;
                width: ${width};
                box-sizing: border-box;
                color: ${settings.primaryColor};
              }
              .header {
                text-align: center;
                border-bottom: 1px dashed ${settings.primaryColor};
                padding-bottom: 8px;
                margin-bottom: 8px;
              }
              .company-name {
                font-weight: bold;
                font-size: ${effectivePaperWidth === "57mm" ? "12px" : effectivePaperWidth === "A4" ? "24px" : "16px"};
                color: ${settings.primaryColor};
              }
              .business-name {
                font-size: ${effectivePaperWidth === "57mm" ? "9px" : effectivePaperWidth === "A4" ? "16px" : "11px"};
                color: ${settings.accentColor};
                margin-top: 2px;
              }
              .header-message {
                font-size: ${effectivePaperWidth === "57mm" ? "8px" : effectivePaperWidth === "A4" ? "14px" : "10px"};
                color: ${settings.accentColor};
                margin: 8px 0;
                padding: 4px 0;
                border-top: 1px dashed ${settings.accentColor};
                border-bottom: 1px dashed ${settings.accentColor};
              }
              .receipt-title {
                font-weight: bold;
                font-size: ${effectivePaperWidth === "57mm" ? "11px" : effectivePaperWidth === "A4" ? "20px" : "13px"};
                text-align: center;
                margin: 8px 0;
                padding-bottom: 4px;
                border-bottom: 1px dashed ${settings.primaryColor};
              }
              .invoice-info {
                margin-bottom: 8px;
                border-bottom: 1px dashed ${settings.primaryColor};
                padding-bottom: 8px;
              }
              .items {
                margin-bottom: 8px;
              }
              .item {
                margin-bottom: 4px;
              }
              .item-header {
                font-weight: bold;
              }
              .item-details {
                display: flex;
                justify-content: space-between;
                font-size: ${effectivePaperWidth === "57mm" ? "9px" : effectivePaperWidth === "A4" ? "14px" : "10px"};
              }
              .totals {
                border-top: 1px dashed ${settings.primaryColor};
                padding-top: 8px;
                margin-top: 8px;
              }
              .total-line {
                display: flex;
                justify-content: space-between;
                margin: 2px 0;
              }
              .grand-total {
                font-weight: bold;
                border-top: 1px solid ${settings.primaryColor};
                padding-top: 4px;
                margin-top: 4px;
              }
              .payment-section {
                border-top: 1px dashed ${settings.primaryColor};
                padding-top: 8px;
                margin-top: 8px;
              }
              .footer {
                text-align: center;
                margin-top: 16px;
                padding-top: 8px;
                border-top: 1px dashed ${settings.primaryColor};
                font-size: ${effectivePaperWidth === "57mm" ? "8px" : effectivePaperWidth === "A4" ? "12px" : "9px"};
                color: ${settings.accentColor};
              }
              .logo {
                max-height: ${effectivePaperWidth === "57mm" ? "24px" : effectivePaperWidth === "A4" ? "64px" : "32px"};
                max-width: 100%;
                margin-bottom: 8px;
              }
              @media print {
                body { margin: auto; }
              }
            </style>
          </head>
          <body>
          
            <div class="header">
              ${settings.showLogo && settings.logoUrl ? `
                <div style="margin-bottom: 8px;">
                  <img src="${settings.logoUrl}" alt="Logo" class="logo" />
                </div>
              ` : ""}
              <div class="company-name">${settings.companyName}</div>
              ${settings.businessName ? `<div class="business-name">${settings.businessName}</div>` : ""}
              <div style="font-size: ${effectivePaperWidth === "57mm" ? "8px" : effectivePaperWidth === "A4" ? "12px" : "9px"}; margin-top: 4px;">
                <div>${settings.address}</div>
                <div>${settings.city}, ${settings.state} ${settings.country}</div>
                ${settings.phone ? `<div>Phone: ${settings.phone}</div>` : ""}
                ${settings.email ? `<div>Email: ${settings.email}</div>` : ""}
                ${settings.website ? `<div>Web: ${settings.website}</div>` : ""}
              </div>
            </div>

            ${settings.headerMessage ? `
              <div class="header-message">
                ${settings.headerMessage}
              </div>
            ` : ""}

            <div class="receipt-title">${settings.receiptTitle || "SALES INVOICE"}</div>

            <div class="invoice-info">
              <div><strong>Invoice:</strong> ${data.invoiceNo}</div>
              <div><strong>Date:</strong> ${data.date}</div>
              <div><strong>Time:</strong> ${data.time}</div>
              ${settings.showCustomerInfo ? `<div><strong>Customer:</strong> ${data.customer}</div>` : ""}
              ${settings.showCashierInfo ? `<div><strong>Cashier:</strong> ${data.cashier}</div>` : ""}
            </div>

            <div class="items">
              <div style="border-bottom: 1px dashed ${settings.primaryColor}; padding-bottom: 4px; margin-bottom: 8px;">
                <strong>ITEMS</strong>
              </div>
              ${data.items
                .map(
                  (item, index) => `
                <div class="item">
                  <div class="item-header">${settings.showItemNumbers ? `${index + 1}. ` : ""}${item.name}</div>
                  <div class="item-details">
                    <span>${item.quantity} x ${formatAmount(item.price)}</span>
                    <span>${formatAmount(item.total)}</span>
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>

            <div class="totals">
              <div class="total-line">
                <span>Subtotal:</span>
                <span>${formatAmount(data.subtotal)}</span>
              </div>
              ${
                data.discount > 0
                  ? `
              <div class="total-line">
                <span>Discount:</span>
                <span>-${formatAmount(data.discount)}</span>
              </div>
              `
                  : ""
              }
              ${settings.showTaxBreakdown ? `
                <div class="total-line">
                  <span>Tax:</span>
                  <span>${formatAmount(data.tax)}</span>
                </div>
              ` : ""}
              <div class="total-line grand-total">
                <span>TOTAL:</span>
                <span>${formatAmount(data.total)}</span>
              </div>
            </div>

            <div class="payment-section">
              <div style="font-weight: bold; margin-bottom: 4px;">PAYMENT</div>
              ${formatPaymentMethods()}
              <div class="total-line" style="font-weight: bold; margin-top: 8px;">
                <span>Total Paid:</span>
                <span>${formatAmount(data.totalPaid || data.paid || 0)}</span>
              </div>
              ${
                settings.showBalance && (data.balance !== undefined ? data.balance : data.total - (data.totalPaid || data.paid || 0)) !== 0
                  ? `
              <div class="total-line">
                <span>Balance:</span>
                <span>${formatAmount(Math.abs(data.balance !== undefined ? data.balance : data.total - (data.totalPaid || data.paid || 0)))}</span>
              </div>
              `
                  : ""
              }
            </div>

            <div class="footer">
              <div>Copyright © ${new Date().getFullYear()} Code Git</div>
              ${settings.footerMessage ? `<div style="font-weight: bold; margin-top: 4px;">${settings.footerMessage}</div>` : ""}
              ${settings.showTimestamp ? `<div style="margin-top: 8px;">Generated on ${new Date().toLocaleString()}</div>` : ""}
            </div>
          </body>
        </html>
      `

      printWindow.document.write(html)
      printWindow.document.close()

      // Print multiple copies if configured
      const printCopies = settings.printCopyCount || 1
      
      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(async () => {
          for (let i = 0; i < printCopies; i++) {
            printWindow.print()
            if (i < printCopies - 1) {
              // Small delay between prints if multiple copies
              await new Promise(resolve => setTimeout(resolve, 500))
            }
          }
          
          if (!settings.autoPrint) {
            // Only close if not auto-printing (let user see the preview)
            setTimeout(() => printWindow.close(), 1000)
          }
        }, 250)
      }
    } catch (error) {
      console.error("Error printing receipt:", error)
      printWindow.close()
      alert("Error printing receipt. Please try again.")
    }
  }, [warehousesId])

  return { printReceipt }
}