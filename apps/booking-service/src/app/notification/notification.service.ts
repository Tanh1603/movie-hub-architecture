import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { BookingDetailDto } from '@movie-hub/shared-types';
import { ConfigService } from '@nestjs/config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface TicketWithQRCode {
  ticketCode: string;
  seatNumber: string;
  ticketType: string;
  price: number;
  qrCode: string; // Base64 data URL
}

export interface BookingConfirmationEmailData {
  booking: BookingDetailDto;
  tickets: TicketWithQRCode[];
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeMailer();
  }

  private initializeMailer() {
    const emailEnabled =
      this.configService.get('EMAIL_ENABLED', 'false') === 'true';

    if (!emailEnabled) {
      this.logger.warn(
        'Email notifications are DISABLED. Set EMAIL_ENABLED=true to enable.'
      );
      return;
    }

    const host = this.configService.get('EMAIL_HOST', 'smtp.gmail.com');
    const port = parseInt(this.configService.get('EMAIL_PORT', '587'), 10);
    const secure = this.configService.get('EMAIL_SECURE', 'false') === 'true';
    const user = this.configService.get('EMAIL_USER');
    const pass = this.configService.get('EMAIL_PASSWORD');

    if (!user || !pass) {
      this.logger.warn(
        'Email credentials not configured. Email notifications will not work.'
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    // Verify connection
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error('Email transporter verification failed:', error);
      } else {
        this.logger.log('Email transporter is ready to send emails');
      }
    });
  }

  /**
   * Send generic email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        'Email transporter not initialized. Skipping email send.'
      );
      return false;
    }

    try {
      const from = this.configService.get(
        'EMAIL_FROM',
        'MovieHub <noreply@moviehub.com>'
      );

      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      });

      this.logger.log(
        `Email sent successfully to ${options.to}: ${info.messageId}`
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  /**
   * Send booking confirmation email with tickets
   */
  async sendBookingConfirmation(
    data: BookingConfirmationEmailData
  ): Promise<boolean> {
    const { booking, tickets } = data;

    const subject = `🎬 Booking Confirmation - ${booking.bookingCode}`;

    // Prepare attachments for QR codes
    const attachments = tickets.map((ticket) => {
      // Remove data URL header if present to get raw base64
      const base64Content = ticket.qrCode.replace(
        /^data:image\/\w+;base64,/,
        ''
      );

      return {
        filename: `qrcode-${ticket.ticketCode}.png`,
        content: Buffer.from(base64Content, 'base64'),
        cid: `qrcode-${ticket.ticketCode}`, // Content ID for referencing in HTML
      };
    });

    const html = this.generateBookingConfirmationHTML(data);

    return this.sendEmail({
      to: booking.customerEmail,
      subject,
      html,
      attachments,
    });
  }

  /**
   * Send booking cancellation notification
   */
  async sendBookingCancellation(
    booking: BookingDetailDto,
    refundAmount?: number
  ): Promise<boolean> {
    const subject = `❌ Booking Cancelled - ${booking.bookingCode}`;
    const html = this.generateCancellationHTML(booking, refundAmount);

    return this.sendEmail({
      to: booking.customerEmail,
      subject,
      html,
    });
  }

  /**
   * Send booking reschedule notification
   */
  async sendBookingReschedule(
    oldBooking: BookingDetailDto,
    newBooking: BookingDetailDto
  ): Promise<boolean> {
    const subject = `🔄 Booking Rescheduled - ${oldBooking.bookingCode}`;
    const html = this.generateRescheduleHTML(oldBooking, newBooking);

    return this.sendEmail({
      to: oldBooking.customerEmail,
      subject,
      html,
    });
  }

  /**
   * Send payment reminder (for pending bookings)
   */
  async sendPaymentReminder(
    booking: BookingDetailDto,
    paymentUrl?: string
  ): Promise<boolean> {
    const subject = `⏰ Payment Reminder - ${booking.bookingCode}`;
    const html = this.generatePaymentReminderHTML(booking, paymentUrl);

    return this.sendEmail({
      to: booking.customerEmail,
      subject,
      html,
    });
  }

  /**
   * Send showtime reminder (1-2 hours before movie)
   */
  async sendShowtimeReminder(booking: BookingDetailDto): Promise<boolean> {
    const subject = `🎥 Showtime Reminder - ${booking.movieTitle}`;
    const html = this.generateShowtimeReminderHTML(booking);

    return this.sendEmail({
      to: booking.customerEmail,
      subject,
      html,
    });
  }

  // ==================== HTML TEMPLATES ====================

  private generateBookingConfirmationHTML(
    data: BookingConfirmationEmailData
  ): string {
    const { booking } = data;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .booking-code { font-size: 32px; font-weight: bold; color: #ffd700; margin: 10px 0; }
    .section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .section-title { font-size: 18px; font-weight: bold; color: #667eea; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .info-row:last-child { border-bottom: none; }
    .label { font-weight: bold; color: #666; }
    .value { color: #333; }
    .seats { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
    .seat { background: #667eea; color: white; padding: 8px 12px; border-radius: 5px; font-weight: bold; }
    .total { font-size: 24px; font-weight: bold; color: #667eea; text-align: right; margin-top: 20px; }
    .footer { text-align: center; color: #666; margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; }
    .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎬 Booking Confirmed!</h1>
      <div class="booking-code">${booking.bookingCode}</div>
      <p>Your movie tickets are ready!</p>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="section-title">🎥 Movie Information</div>
        <div class="info-row">
          <span class="label">Movie:</span>
          <span class="value">${booking.movieTitle}</span>
        </div>
        <div class="info-row">
          <span class="label">Cinema:</span>
          <span class="value">${booking.cinemaName}</span>
        </div>
        <div class="info-row">
          <span class="label">Hall:</span>
          <span class="value">${booking.hallName}</span>
        </div>
        <div class="info-row">
          <span class="label">Date & Time:</span>
          <span class="value">${new Date(booking.startTime).toLocaleString(
            'vi-VN'
          )}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">🎫 Seats</div>
        <div class="seats">
          ${booking.seats
            .map((seat) => `<div class="seat">${seat.row}${seat.number}</div>`)
            .join('')}
        </div>
      </div>

      ${
        data.tickets && data.tickets.length > 0
          ? `
      <div class="section">
        <div class="section-title">🎟️ Your Tickets with QR Codes</div>
        <p style="color: #666; margin-bottom: 20px;">Show these QR codes at the cinema entrance for validation.</p>
        ${data.tickets
          .map(
            (ticket) => `
          <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 15px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: bold; font-size: 16px; color: #667eea;">Seat ${
                  ticket.seatNumber
                }</div>
                <div style="color: #666; margin: 5px 0;">Ticket: ${
                  ticket.ticketCode
                }</div>
                <div style="color: #666;">Type: ${ticket.ticketType}</div>
                <div style="font-weight: bold; color: #333; margin-top: 5px;">${ticket.price.toLocaleString()} VND</div>
              </div>
              <div style="text-align: center;">
                <img src="cid:qrcode-${
                  ticket.ticketCode
                }" alt="QR Code" style="width: 120px; height: 120px; border: 2px solid #eee; border-radius: 5px;" />
                <div style="font-size: 11px; color: #999; margin-top: 5px;">Scan at entrance</div>
              </div>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
      `
          : ''
      }

      ${
        booking.concessions && booking.concessions.length > 0
          ? `
      <div class="section">
        <div class="section-title">🍿 Concessions</div>
        ${booking.concessions
          .map(
            (item) => `
          <div class="info-row">
            <span class="label">${item.quantity}x ${item.name}</span>
            <span class="value">${item.totalPrice.toLocaleString()} VND</span>
          </div>
        `
          )
          .join('')}
      </div>
      `
          : ''
      }

      <div class="section">
        <div class="section-title">💰 Payment Summary</div>
        <div class="info-row">
          <span class="label">Subtotal:</span>
          <span class="value">${booking.subtotal.toLocaleString()} VND</span>
        </div>
        ${
          booking.discount > 0
            ? `
        <div class="info-row">
          <span class="label">Discount:</span>
          <span class="value" style="color: green;">-${booking.discount.toLocaleString()} VND</span>
        </div>
        `
            : ''
        }
        ${
          booking.pointsDiscount > 0
            ? `
        <div class="info-row">
          <span class="label">Loyalty Points (${booking.pointsUsed} pts):</span>
          <span class="value" style="color: green;">-${booking.pointsDiscount.toLocaleString()} VND</span>
        </div>
        `
            : ''
        }
        <div class="total">Total: ${booking.finalAmount.toLocaleString()} VND</div>
      </div>

      <div class="warning">
        <strong>⚠️ Cancellation Policy:</strong><br>
        - Cancellations must be made at least 24 hours before showtime<br>
        - Refund: 100% of ticket price (as voucher)<br>
        - Rescheduling is allowed once per booking
      </div>

      <div style="text-align: center;">
        <p>Show this booking code at the cinema or use the QR code from your tickets.</p>
      </div>
    </div>

    <div class="footer">
      <p><strong>MovieHub Cinema</strong></p>
      <p>For support, contact us at support@moviehub.com</p>
      <p style="font-size: 12px; color: #999;">This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private generateCancellationHTML(
    booking: BookingDetailDto,
    refundAmount?: number
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .refund-box { background: #d4edda; border: 2px solid #28a745; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .refund-amount { font-size: 32px; font-weight: bold; color: #28a745; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Booking Cancelled</h1>
      <h2>${booking.bookingCode}</h2>
    </div>
    
    <div class="content">
      <div class="section">
        <h3>Cancelled Booking Details:</h3>
        <div class="info-row">
          <span>Movie:</span>
          <span>${booking.movieTitle}</span>
        </div>
        <div class="info-row">
          <span>Cinema:</span>
          <span>${booking.cinemaName}</span>
        </div>
        <div class="info-row">
          <span>Date & Time:</span>
          <span>${new Date(booking.startTime).toLocaleString('vi-VN')}</span>
        </div>
        <div class="info-row">
          <span>Cancelled At:</span>
          <span>${new Date(booking.cancelledAt || new Date()).toLocaleString(
            'vi-VN'
          )}</span>
        </div>
        ${
          booking.cancellationReason
            ? `
        <div class="info-row">
          <span>Reason:</span>
          <span>${booking.cancellationReason}</span>
        </div>
        `
            : ''
        }
      </div>

      ${
        refundAmount && refundAmount > 0
          ? `
      <div class="refund-box">
        <h3>💰 Refund Amount</h3>
        <div class="refund-amount">${refundAmount.toLocaleString()} VND</div>
        <p>Refund will be processed within 3-7 business days</p>
      </div>
      `
          : ''
      }

      <div class="section">
        <p><strong>Note:</strong> Your tickets have been cancelled and can no longer be used.</p>
        ${
          refundAmount
            ? '<p>You will receive the refund to your original payment method.</p>'
            : ''
        }
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  private generateRescheduleHTML(
    oldBooking: BookingDetailDto,
    newBooking: BookingDetailDto
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #17a2b8; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .old-time { text-decoration: line-through; color: #999; }
    .new-time { color: #28a745; font-weight: bold; font-size: 18px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔄 Booking Rescheduled</h1>
      <h2>${oldBooking.bookingCode}</h2>
    </div>
    
    <div class="content">
      <div class="section">
        <h3>Your showtime has been changed:</h3>
        <p class="old-time">Old Time: ${new Date(
          oldBooking.startTime
        ).toLocaleString('vi-VN')}</p>
        <p class="new-time">New Time: ${new Date(
          newBooking.startTime
        ).toLocaleString('vi-VN')}</p>
        <p><strong>Movie:</strong> ${newBooking.movieTitle}</p>
        <p><strong>Cinema:</strong> ${newBooking.cinemaName} - ${
      newBooking.hallName
    }</p>
      </div>

      <div class="section">
        <p><strong>Note:</strong> This is your only allowed rescheduling for this booking.</p>
        <p>All other booking details remain the same.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  private generatePaymentReminderHTML(
    booking: BookingDetailDto,
    paymentUrl?: string
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ffc107; color: #333; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Complete Your Payment</h1>
      <h2>${booking.bookingCode}</h2>
    </div>
    
    <div class="content">
      <div class="warning">
        <strong>Your booking is about to expire!</strong><br>
        Please complete payment before: ${new Date(
          booking.expiresAt || new Date()
        ).toLocaleString('vi-VN')}
      </div>

      <p><strong>Movie:</strong> ${booking.movieTitle}</p>
      <p><strong>Amount:</strong> ${booking.finalAmount.toLocaleString()} VND</p>

      ${
        paymentUrl
          ? `
      <div style="text-align: center;">
        <a href="${paymentUrl}" class="button">Complete Payment Now</a>
      </div>
      `
          : ''
      }
    </div>
  </div>
</body>
</html>
    `;
  }

  private generateShowtimeReminderHTML(booking: BookingDetailDto): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .time-box { background: #667eea; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .time { font-size: 32px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎥 Your Movie Starts Soon!</h1>
    </div>
    
    <div class="content">
      <h2>${booking.movieTitle}</h2>
      
      <div class="time-box">
        <p>Showtime</p>
        <div class="time">${new Date(booking.startTime).toLocaleString(
          'vi-VN'
        )}</div>
      </div>

      <p><strong>Cinema:</strong> ${booking.cinemaName} - ${
      booking.hallName
    }</p>
      <p><strong>Seats:</strong> ${booking.seats
        .map((s) => `${s.row}${s.number}`)
        .join(', ')}</p>
      <p><strong>Booking Code:</strong> ${booking.bookingCode}</p>

      <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
        <p><strong>📍 Remember to arrive 15 minutes early!</strong></p>
        <p>Have your QR code ready for scanning.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  // ==================== SMS INTEGRATION (Placeholder) ====================

  /**
   * Send SMS notification (placeholder - needs SMS provider like Twilio)
   */
  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
    this.logger.log(`SMS to ${phoneNumber}: ${message}`);
    this.logger.warn(
      'SMS integration not implemented yet. Use Twilio or similar service.'
    );
    return false;
  }

  async sendBookingConfirmationSMS(
    booking: BookingDetailDto
  ): Promise<boolean> {
    if (!booking.customerPhone) return false;

    const message = `MovieHub: Booking ${booking.bookingCode} confirmed! ${
      booking.movieTitle
    } at ${booking.cinemaName}, ${new Date(booking.startTime).toLocaleString(
      'vi-VN'
    )}. Seats: ${booking.seats.map((s) => `${s.row}${s.number}`).join(', ')}`;

    return this.sendSMS(booking.customerPhone, message);
  }

  async sendCancellationSMS(booking: BookingDetailDto): Promise<boolean> {
    if (!booking.customerPhone) return false;

    const message = `MovieHub: Booking ${booking.bookingCode} has been cancelled. Refund will be processed within 3-7 days.`;

    return this.sendSMS(booking.customerPhone, message);
  }
}
