from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = 'Create a superuser admin account for SocialConnect'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, help='Admin username', default='admin')
        parser.add_argument('--email', type=str, help='Admin email', default='admin@socialconnect.com')
        parser.add_argument('--password', type=str, help='Admin password', default='admin123')
        parser.add_argument('--first-name', type=str, help='First name', default='Admin')
        parser.add_argument('--last-name', type=str, help='Last name', default='User')

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']
        first_name = options['first_name']
        last_name = options['last_name']

        # Check if admin user already exists
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(f'Admin user "{username}" already exists.')
            )
            return

        # Create admin user
        admin_user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role='admin',
            is_staff=True,
            is_superuser=True,
            is_verified=True
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created admin user "{username}" with email "{email}"'
            )
        )
        self.stdout.write(
            f'Login credentials:\n'
            f'Username: {username}\n'
            f'Email: {email}\n'
            f'Password: {password}'
        )