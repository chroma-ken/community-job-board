import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, updateDoc, doc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class EnhanceJobsService {
  private firestore = inject(Firestore);

  async enhanceJobDescriptions(): Promise<void> {
    try {
      const jobsCollection = collection(this.firestore, 'jobs');
      const snapshot = await getDocs(jobsCollection);

      let enhancedCount = 0;

      for (const jobDoc of snapshot.docs) {
        const data = jobDoc.data();
        const title = data['title'];

        const enhancedDescription = this.generateDetailedDescription(title);

        await updateDoc(doc(this.firestore, 'jobs', jobDoc.id), {
          description: enhancedDescription.description,
          minimumRequirements: enhancedDescription.minimumRequirements,
          preferredRequirements: enhancedDescription.preferredRequirements,
          jobExpectations: enhancedDescription.jobExpectations
        });

        console.log(`Enhanced job: ${title}`);
        enhancedCount++;
      }

      console.log(`%c✓ Enhanced ${enhancedCount} job descriptions`, 'color: green; font-weight: bold;');
    } catch (error) {
      console.error('Error enhancing job descriptions:', error);
    }
  }

  private generateDetailedDescription(title: string): {
    description: string;
    minimumRequirements: string[];
    preferredRequirements: string[];
    jobExpectations: string[];
  } {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('software') || lowerTitle.includes('developer') || lowerTitle.includes('engineer')) {
      return {
        description: `We are seeking a talented ${title} to join our dynamic team. You will be responsible for designing, developing, and maintaining high-quality software solutions. This role offers an opportunity to work on cutting-edge technologies and contribute to impactful projects that serve thousands of users.`,
        minimumRequirements: [
          'Bachelor\'s degree in Computer Science, Engineering, or related field',
          '2+ years of professional software development experience',
          'Strong programming skills in at least one modern language',
          'Experience with version control systems (Git)',
          'Understanding of software development lifecycle and agile methodologies',
          'Excellent problem-solving and analytical skills'
        ],
        preferredRequirements: [
          'Experience with cloud platforms (AWS, Azure, or GCP)',
          'Knowledge of containerization technologies (Docker, Kubernetes)',
          'Familiarity with CI/CD pipelines',
          'Experience with test-driven development',
          'Contributions to open-source projects',
          'Strong communication and teamwork skills'
        ],
        jobExpectations: [
          'Write clean, maintainable, and efficient code',
          'Collaborate with cross-functional teams to define and ship new features',
          'Participate in code reviews and provide constructive feedback',
          'Debug and resolve technical issues in production environments',
          'Stay updated with emerging technologies and industry trends',
          'Contribute to technical documentation and knowledge sharing'
        ]
      };
    }

    if (lowerTitle.includes('designer') || lowerTitle.includes('ui') || lowerTitle.includes('ux')) {
      return {
        description: `Join our creative team as a ${title}! You will craft beautiful, intuitive user experiences that delight our customers. Working closely with product managers and developers, you'll bring ideas to life through thoughtful design and user research.`,
        minimumRequirements: [
          'Bachelor\'s degree in Design, HCI, or related field',
          '2+ years of professional design experience',
          'Strong portfolio demonstrating design thinking and execution',
          'Proficiency in design tools (Figma, Sketch, Adobe Creative Suite)',
          'Understanding of user-centered design principles',
          'Experience with responsive and mobile-first design'
        ],
        preferredRequirements: [
          'Experience conducting user research and usability testing',
          'Knowledge of HTML/CSS and front-end development basics',
          'Familiarity with design systems and component libraries',
          'Animation and motion design skills',
          'Experience with prototyping tools',
          'Understanding of accessibility standards (WCAG)'
        ],
        jobExpectations: [
          'Create wireframes, mockups, and high-fidelity designs',
          'Conduct user research and translate findings into design decisions',
          'Collaborate with developers to ensure design implementation',
          'Maintain and evolve design system components',
          'Present design concepts to stakeholders',
          'Iterate designs based on user feedback and metrics'
        ]
      };
    }

    if (lowerTitle.includes('manager') || lowerTitle.includes('lead')) {
      return {
        description: `We are looking for an experienced ${title} to lead our team to success. You will be responsible for strategic planning, team development, and ensuring project delivery. This leadership role requires strong communication skills and the ability to inspire and mentor team members.`,
        minimumRequirements: [
          'Bachelor\'s degree in relevant field or equivalent experience',
          '5+ years of professional experience with 2+ years in leadership',
          'Proven track record of successful project delivery',
          'Strong leadership and people management skills',
          'Excellent communication and interpersonal abilities',
          'Experience with budget management and resource planning'
        ],
        preferredRequirements: [
          'MBA or relevant advanced degree',
          'Experience managing remote or distributed teams',
          'Certifications in project management (PMP, Agile, Scrum)',
          'Industry-specific domain expertise',
          'Experience with performance management and coaching',
          'Strong stakeholder management skills'
        ],
        jobExpectations: [
          'Lead and mentor team members to achieve their full potential',
          'Define project goals, timelines, and success metrics',
          'Manage resource allocation and project budgets',
          'Foster a culture of collaboration and continuous improvement',
          'Communicate project status to stakeholders and executives',
          'Identify and mitigate risks to project success'
        ]
      };
    }

    if (lowerTitle.includes('analyst') || lowerTitle.includes('data')) {
      return {
        description: `Seeking a detail-oriented ${title} to join our analytics team. You will transform raw data into actionable insights that drive business decisions. This role requires strong analytical thinking and the ability to communicate complex findings to non-technical stakeholders.`,
        minimumRequirements: [
          'Bachelor\'s degree in Statistics, Mathematics, Economics, or related field',
          '2+ years of experience in data analysis',
          'Proficiency in SQL and data manipulation',
          'Experience with data visualization tools',
          'Strong analytical and problem-solving skills',
          'Excellent attention to detail'
        ],
        preferredRequirements: [
          'Experience with Python or R for statistical analysis',
          'Knowledge of machine learning concepts',
          'Familiarity with big data technologies',
          'Experience with A/B testing and experimental design',
          'Understanding of statistical modeling techniques',
          'Experience with business intelligence platforms'
        ],
        jobExpectations: [
          'Analyze complex datasets to identify trends and patterns',
          'Create dashboards and reports for stakeholders',
          'Collaborate with teams to define key metrics',
          'Conduct statistical analysis to support business decisions',
          'Present findings and recommendations to leadership',
          'Ensure data quality and integrity'
        ]
      };
    }

    return {
      description: `We are hiring for the position of ${title}. Join our growing team and contribute to exciting projects. This role offers competitive compensation, professional development opportunities, and a collaborative work environment where your contributions are valued.`,
      minimumRequirements: [
        'Relevant bachelor\'s degree or equivalent work experience',
        '2+ years of professional experience in related field',
        'Strong communication and collaboration skills',
        'Ability to work independently and as part of a team',
        'Problem-solving mindset and attention to detail',
        'Proficiency in relevant tools and technologies'
      ],
      preferredRequirements: [
        'Advanced degree or professional certifications',
        'Experience in similar industry or domain',
        'Leadership or mentoring experience',
        'Track record of successful project delivery',
        'Continuous learning and professional development',
        'Strong portfolio or work samples'
      ],
      jobExpectations: [
        'Deliver high-quality work that meets business objectives',
        'Collaborate effectively with cross-functional teams',
        'Take ownership of assigned projects and responsibilities',
        'Communicate progress and challenges proactively',
        'Contribute to team knowledge sharing and best practices',
        'Adapt to changing priorities and business needs'
      ]
    };
  }
}
