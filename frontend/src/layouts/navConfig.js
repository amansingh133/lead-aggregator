import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import { PRIVILEGED_ROLES } from '../constants/roles';

// Single source of truth for the sidebar: `roles: null` means every
// authenticated user sees it, otherwise it's restricted to the listed roles
// (mirrors the backend's authorize(Admin) gating on /admin and /social).
export const NAV_SECTIONS = [
  {
    items: [
      { label: 'Dashboard', to: '/', icon: DashboardOutlinedIcon, roles: null },
      { label: 'Projects', to: '/projects', icon: ApartmentOutlinedIcon, roles: null },
      { label: 'Leads', to: '/leads', icon: PeopleAltOutlinedIcon, roles: null },
      { label: 'Attendance', to: '/attendance', icon: EventAvailableOutlinedIcon, roles: null },
    ],
  },
  {
    title: 'Facebook Lead Ads',
    items: [
      { label: 'Meta Connections', to: '/social/meta', icon: LinkOutlinedIcon, roles: PRIVILEGED_ROLES },
      { label: 'Campaigns', to: '/social/campaigns', icon: CampaignOutlinedIcon, roles: PRIVILEGED_ROLES },
    ],
  },
  {
    title: 'Administration',
    items: [{ label: 'Team', to: '/admin/employees', icon: BadgeOutlinedIcon, roles: PRIVILEGED_ROLES }],
  },
];
