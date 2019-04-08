require 'html-proofer'

task :serve do
  sh "bundle exec jekyll serve --watch"
end

task :test do
  sh "bundle exec jekyll build"
  options = {
  	:assume_extension => true,
  	:allow_hash_href => true,
  }
  HTMLProofer.check_directory("./_site", options).run
end
