import axios from 'axios';
import { addDays, formatISO } from 'date-fns';


export async function fetchAllCalendarEvents(session: any, selectedCalendarIds?: string[]) {
  const accessToken = session.accessToken;
  const now = new Date();
  // RFC3339 UTC format (e.g., 2012-01-31T09:00:00Z)
  const pad = (n: number) => n.toString().padStart(2, '0');
  const toRFC3339UTC = (date: Date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth()+1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}Z`;
  // Start of today UTC
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  // End of today UTC
  const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));
  const timeMin = toRFC3339UTC(startOfDay);
  const timeMax = toRFC3339UTC(endOfDay);
  try {
    // Fetch all calendars
    const calendarListRes = await axios.get('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const calendars = calendarListRes.data.items || [];
    // Fetch events from each accessible calendar
    let allEvents: any[] = [];
    for (const calendar of calendars) {
      // Only fetch if accessRole is not 'none', calendar is selected, and (if provided) calendar is in selectedCalendarIds
      const isAccessible = (calendar.accessRole === 'owner' || calendar.accessRole === 'reader') && calendar.selected !== false;
      const isSelected = !selectedCalendarIds || selectedCalendarIds.includes(calendar.id);
      if (isAccessible && isSelected) {
        try {
          const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?timeMin=${timeMin}&timeMax=${timeMax}&orderBy=startTime&singleEvents=true`;
          console.log(url);
          const res = await axios.get(url, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          const events = res.data.items || [];
          // Attach calendar info to each event
          events.forEach((event: any) => {
            event.calendarId = calendar.id;
            event.calendarSummary = calendar.summary;
            event.organizerEmail = event.organizer?.email || "";
          });
          allEvents.push(...events);
        } catch (error: any) {
          console.error(`Error fetching events for calendar ${calendar.id}:`, error.response?.data || error);
        }
      } else {
        console.log(`Skipping calendar ${calendar.id} (accessRole: ${calendar.accessRole}, selected: ${calendar.selected}, selectedCalendarIds: ${selectedCalendarIds})`);
      }
    }
    // Normalize and combine events
    const combinedEvents = allEvents.map(item => {
      const start = item.start?.dateTime || item.start?.date;
      const end = item.end?.dateTime || item.end?.date;
      const location = item.location || "";
      const calendar = item.organizerEmail || item.calendarSummary || "";
      const startDate = new Date(start);
      const endDate = new Date(end);
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationMinutes = Math.floor(durationMs / (1000 * 60));
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      const totalTime = `${hours}:${minutes.toString().padStart(2, '0')}`;
      return {
        json: {
          title: item.summary,
          location,
          startTime: start,
          endTime: end,
          totalTime,
          calendar,
        },
        id: item.id,
      };
    });
    // Sort by startTime
    combinedEvents.sort((a, b) => new Date(a.json.startTime).getTime() - new Date(b.json.startTime).getTime());
    return combinedEvents;
  } catch (error: any) {
    if (error.response) {
      console.error('Google API error:', error.response.status, error.response.data);
      console.error('Full error object:', error.response);
      throw new Error(`Google API error: ${error.response.status} - ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}
