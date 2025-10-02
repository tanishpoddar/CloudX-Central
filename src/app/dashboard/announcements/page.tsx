import { getCurrentUser } from "@/lib/auth";
import { 
    getAnnouncements, 
    getAllUsers, 
    getCommentsForAnnouncement,
    getReactionsForAnnouncements,
    getPollVotesForAnnouncements
} from "@/lib/data";
import AnnouncementsClient from "./announcements-client";

export default async function AnnouncementsPage() {
    const currentUser = await getCurrentUser();
    if (!currentUser) return null;

    const announcements = await getAnnouncements();
    const users = await getAllUsers();
    
    const announcementIds = announcements.map(a => a.id);

    const [comments, reactions, pollVotes] = await Promise.all([
        Promise.all(announcementIds.map(id => getCommentsForAnnouncement(id))).then(res => res.flat()),
        getReactionsForAnnouncements(announcementIds),
        getPollVotesForAnnouncements(announcementIds),
    ]);

    return (
        <AnnouncementsClient 
            currentUser={currentUser}
            initialAnnouncements={announcements}
            users={users}
            initialComments={comments}
            initialReactions={reactions}
            initialPollVotes={pollVotes}
        />
    )
}
