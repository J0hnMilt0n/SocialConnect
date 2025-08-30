from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import User
from posts.models import Post
from social.models import Follow, Like, Comment
import random


class Command(BaseCommand):
    help = 'Create sample data for SocialConnect development and testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--users',
            type=int,
            default=10,
            help='Number of sample users to create'
        )
        parser.add_argument(
            '--posts',
            type=int,
            default=20,
            help='Number of sample posts to create'
        )

    def handle(self, *args, **options):
        users_count = options['users']
        posts_count = options['posts']

        self.stdout.write('Creating sample data for SocialConnect...')

        # Create sample users
        users = self.create_sample_users(users_count)
        self.stdout.write(
            self.style.SUCCESS(f'Created {len(users)} sample users')
        )

        # Create sample posts
        posts = self.create_sample_posts(users, posts_count)
        self.stdout.write(
            self.style.SUCCESS(f'Created {len(posts)} sample posts')
        )

        # Create sample follows
        follows_count = self.create_sample_follows(users)
        self.stdout.write(
            self.style.SUCCESS(f'Created {follows_count} follow relationships')
        )

        # Create sample likes
        likes_count = self.create_sample_likes(users, posts)
        self.stdout.write(
            self.style.SUCCESS(f'Created {likes_count} likes')
        )

        # Create sample comments
        comments_count = self.create_sample_comments(users, posts)
        self.stdout.write(
            self.style.SUCCESS(f'Created {comments_count} comments')
        )

        self.stdout.write(
            self.style.SUCCESS('Sample data creation completed!')
        )

    def create_sample_users(self, count):
        """Create sample users."""
        sample_users = []
        
        for i in range(count):
            username = f'user{i+1}'
            email = f'user{i+1}@example.com'
            
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password='password123',
                    first_name=f'User',
                    last_name=f'{i+1}',
                    bio=f'This is the bio for {username}. I love sharing and connecting with others!',
                    is_verified=random.choice([True, False])
                )
                sample_users.append(user)

        return sample_users

    def create_sample_posts(self, users, count):
        """Create sample posts."""
        sample_posts = []
        
        post_contents = [
            "Just had an amazing day at the beach! 🌊",
            "Working on my new project. Excited to share it soon!",
            "Coffee and coding - perfect combination ☕",
            "Beautiful sunset today. Nature is incredible! 🌅",
            "Learning something new every day. Growth mindset! 📚",
            "Weekend vibes are the best! 🎉",
            "Grateful for all the support from this community ❤️",
            "New blog post is live! Check it out.",
            "Feeling inspired after today's meeting 💡",
            "Pizza time! What's your favorite topping? 🍕",
            "Another day, another opportunity to grow",
            "Love connecting with like-minded people here",
            "Just finished reading an amazing book",
            "Workout complete! Feeling energized 💪",
            "Happy Friday everyone! Any weekend plans?",
            "Technology is changing so fast these days",
            "Enjoying some quality time with family",
            "Music has the power to change your mood 🎵",
            "Celebrating small wins today!",
            "Looking forward to new adventures ahead"
        ]
        
        categories = ['general', 'announcement', 'question']
        
        for i in range(count):
            author = random.choice(users)
            content = random.choice(post_contents)
            category = random.choice(categories)
            
            post = Post.objects.create(
                content=content,
                author=author,
                category=category
            )
            sample_posts.append(post)

        return sample_posts

    def create_sample_follows(self, users):
        """Create sample follow relationships."""
        follows_count = 0
        
        for user in users:
            # Each user follows 3-7 random other users
            num_follows = random.randint(3, min(7, len(users) - 1))
            potential_follows = [u for u in users if u != user]
            follows = random.sample(potential_follows, num_follows)
            
            for follow_user in follows:
                follow, created = Follow.objects.get_or_create(
                    follower=user,
                    following=follow_user
                )
                if created:
                    follows_count += 1

        return follows_count

    def create_sample_likes(self, users, posts):
        """Create sample likes."""
        likes_count = 0
        
        for post in posts:
            # Each post gets 2-8 random likes
            num_likes = random.randint(2, min(8, len(users)))
            likers = random.sample(users, num_likes)
            
            for user in likers:
                like, created = Like.objects.get_or_create(
                    user=user,
                    post=post
                )
                if created:
                    likes_count += 1
            
            # Update post like count
            post.update_like_count()

        return likes_count

    def create_sample_comments(self, users, posts):
        """Create sample comments."""
        comments_count = 0
        
        comment_contents = [
            "Great post! Thanks for sharing.",
            "I completely agree with this!",
            "This is so inspiring! 🙌",
            "Love this! Keep it up!",
            "Thanks for the insight.",
            "Amazing content as always!",
            "This made my day better 😊",
            "So true! Well said.",
            "Couldn't agree more!",
            "This is exactly what I needed to hear.",
            "Brilliant post! Thanks for sharing your thoughts.",
            "This resonates with me so much!",
            "Keep sharing such amazing content!",
            "You always know what to say!",
            "This is gold! 💯"
        ]
        
        for post in posts:
            # Each post gets 1-4 random comments
            num_comments = random.randint(1, 4)
            
            for _ in range(num_comments):
                author = random.choice(users)
                content = random.choice(comment_contents)
                
                comment = Comment.objects.create(
                    content=content,
                    author=author,
                    post=post
                )
                comments_count += 1
            
            # Update post comment count
            post.update_comment_count()

        return comments_count